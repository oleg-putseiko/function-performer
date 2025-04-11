import isDeepEqual from 'fast-deep-equal';

type Timeout = ReturnType<typeof setTimeout>;

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

type TimedFunctionConfig = {
  interval?: number;
};

type PerformerConfig = {
  debounce?: TimedFunctionConfig;
  throttle?: TimedFunctionConfig;
  deduplication?: TimedFunctionConfig;
};

export class Performer {
  private readonly _debounce: DebounceContext;
  private readonly _throttle: ThrottleContext;
  private readonly _deduplication: DeduplicationContext;

  constructor(config?: PerformerConfig) {
    this._debounce = {
      calls: new Map<DebouncedFunction, DebouncedFunctionCall>(),
      interval: config?.debounce?.interval ?? 0,
    };

    this._throttle = {
      calls: new Set<ThrottledFunction>(),
      interval: config?.throttle?.interval ?? 0,
    };

    this._deduplication = {
      calls: new Map<DeduplicatedFunction, DeduplicatedFunctionCall[]>(),
      interval: config?.deduplication?.interval ?? 0,
    };
  }

  debounce(func: DebouncedFunction, ...args: unknown[]) {
    let call = this._debounce.calls.get(func);

    if (call === undefined) {
      call = { timeout: null };
      this._debounce.calls.set(func, call);
    }

    if (call.timeout !== null) {
      clearTimeout(call.timeout);
      call.timeout = null;
    }

    call.timeout = setTimeout(() => {
      this._debounce.calls.delete(func);
      func(...args);
    }, this._debounce.interval);
  }

  throttle(func: ThrottledFunction, ...args: unknown[]) {
    if (!this._throttle.calls.has(func)) {
      func(...args);
      this._throttle.calls.add(func);

      setTimeout(() => {
        this._throttle.calls.delete(func);
      }, this._throttle.interval);
    }
  }

  deduplicate(func: DeduplicatedFunction, ...args: unknown[]) {
    let calls = this._deduplication.calls.get(func);

    if (calls === undefined) {
      calls = this._deduplication.calls.set(func, []).get(func);
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
      this._deduplication.calls.delete(func);
      func(call.count, ...args);
    }, this._deduplication.interval);
  }
}

export default Performer;
