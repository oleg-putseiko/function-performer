import isDeepEqual from 'fast-deep-equal';

type Timeout = ReturnType<typeof setTimeout>;

type AnyFunction = (...args: any[]) => any;

type DebouncedFunction = (...args: any[]) => any;
type ThrottledFunction = (...args: any[]) => any;
type DeduplicatedFunction = (count: number, ...args: any[]) => any;

type FunctionCall = {
  args: unknown[];
  timeout: Timeout | null;
};

type DebouncedFunctionCall = { timeout: Timeout | null };
type DeduplicatedFunctionCall = FunctionCall & { count: number };

type DebounceContext = {
  calls: Map<DebouncedFunction, DebouncedFunctionCall>;
  interval: number;
};

type ThrottleContext = {
  calls: Set<ThrottledFunction>;
  interval: number;
};

type DeduplicationContext = {
  calls: Map<DeduplicatedFunction, DeduplicatedFunctionCall[]>;
  interval: number;
};

interface IPerformanceFunction {
  (func: AnyFunction, ...args: unknown[]): void;
}

interface IPerformanceProperty<
  TConfig extends PerformanceFunctionConfig = PerformanceFunctionConfig,
> extends IPerformanceFunction {
  configure: (config: TConfig) => IPerformanceFunction;
}

type PerformanceFunctionConfig = {
  interval?: number;
};

type PerformerConfig = {
  debounce?: PerformanceFunctionConfig;
  throttle?: PerformanceFunctionConfig;
  deduplication?: PerformanceFunctionConfig;
};

export class Performer {
  private readonly _debounceContext: DebounceContext;
  private readonly _throttleContext: ThrottleContext;
  private readonly _deduplicationContext: DeduplicationContext;

  readonly debounce: IPerformanceProperty;
  readonly throttle: IPerformanceProperty;
  readonly deduplicate: IPerformanceProperty;

  constructor(config?: PerformerConfig) {
    this._debounceContext = {
      calls: new Map<DebouncedFunction, DebouncedFunctionCall>(),
      interval: config?.debounce?.interval ?? 0,
    };

    this._throttleContext = {
      calls: new Set<ThrottledFunction>(),
      interval: config?.throttle?.interval ?? 0,
    };

    this._deduplicationContext = {
      calls: new Map<DeduplicatedFunction, DeduplicatedFunctionCall[]>(),
      interval: config?.deduplication?.interval ?? 0,
    };

    this.debounce = this._deconfigure(
      this._debounce.bind(this),
    ) as IPerformanceProperty;
    this.debounce.configure = this._configure(this._debounce.bind(this));

    this.throttle = this._deconfigure(
      this._throttle.bind(this),
    ) as IPerformanceProperty;
    this.throttle.configure = this._configure(this._throttle.bind(this));

    this.deduplicate = this._deconfigure(
      this._deduplicate.bind(this),
    ) as IPerformanceProperty;
    this.deduplicate.configure = this._configure(this._deduplicate.bind(this));
  }

  private _deconfigure<TFunction extends AnyFunction>(func: TFunction) {
    return (...args: unknown[]) => func(null, ...args);
  }

  private _configure<
    TFunction extends AnyFunction,
    TConfig extends PerformanceFunctionConfig = PerformanceFunctionConfig,
  >(func: TFunction) {
    return (config: TConfig) => {
      return (...args: unknown[]) => func(config, ...args);
    };
  }

  private _debounce(
    config: PerformanceFunctionConfig | null,
    func: DebouncedFunction,
    ...args: unknown[]
  ) {
    let call = this._debounceContext.calls.get(func);

    if (call === undefined) {
      call = { timeout: null };
      this._debounceContext.calls.set(func, call);
    }

    if (call.timeout !== null) {
      clearTimeout(call.timeout);
      call.timeout = null;
    }

    call.timeout = setTimeout(() => {
      this._debounceContext.calls.delete(func);
      func(...args);
    }, config?.interval ?? this._debounceContext.interval);
  }

  private _throttle(
    config: PerformanceFunctionConfig | null,
    func: ThrottledFunction,
    ...args: unknown[]
  ) {
    if (!this._throttleContext.calls.has(func)) {
      func(...args);
      this._throttleContext.calls.add(func);

      setTimeout(() => {
        this._throttleContext.calls.delete(func);
      }, config?.interval ?? this._throttleContext.interval);
    }
  }

  private _deduplicate(
    config: PerformanceFunctionConfig | null,
    func: DeduplicatedFunction,
    ...args: any[]
  ) {
    let calls = this._deduplicationContext.calls.get(func);

    if (calls === undefined) {
      calls = this._deduplicationContext.calls.set(func, []).get(func);
    }

    let call = calls?.find((item) => isDeepEqual(item.args, args));
    const shouldDeduplicate = call !== undefined;

    if (call === undefined) {
      call = { timeout: null, args, count: 1 };
      calls?.push(call);
    } else {
      call.count++;
    }

    if (call.timeout !== null && shouldDeduplicate) {
      clearTimeout(call.timeout);
      call.timeout = null;
    }

    call.timeout = setTimeout(() => {
      this._deduplicationContext.calls.delete(func);
      func(call.count, ...args);
    }, config?.interval ?? this._deduplicationContext.interval);
  }
}

export default Performer;
