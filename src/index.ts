import isDeepEqual from 'fast-deep-equal';

type Timeout = ReturnType<typeof setTimeout>;

type DeduplicatedFunction = (count: number, ...args: any[]) => any;

type DeduplicatedFunctionCall = {
  count: number;
  args: unknown[];
  timeout: Timeout | null;
};

type Deduplication = {
  calls: Map<DeduplicatedFunction, DeduplicatedFunctionCall[]>;
  interval: number;
};

type DeduplicationConfig = {
  interval?: number;
};

type DebouncedFunction = (...args: any[]) => any;

type DebouncedFunctionCall = {
  args: unknown[];
  timeout: Timeout | null;
};

type Debouncing = {
  calls: Map<DebouncedFunction, DebouncedFunctionCall>;
  interval: number;
};

type DebouncingConfig = {
  interval?: number;
};

type PerformerConfig = {
  debouncing?: DebouncingConfig;
  deduplication?: DeduplicationConfig;
};

export class Performer {
  private readonly _debouncing: Debouncing;
  private readonly _deduplication: Deduplication;

  constructor(config?: PerformerConfig) {
    this._debouncing = {
      calls: new Map<DebouncedFunction, DebouncedFunctionCall>(),
      interval: config?.debouncing?.interval ?? 0,
    };

    this._deduplication = {
      calls: new Map<DeduplicatedFunction, DeduplicatedFunctionCall[]>(),
      interval: config?.deduplication?.interval ?? 0,
    };
  }

  debounce(func: DebouncedFunction, ...args: unknown[]) {
    let call = this._debouncing.calls.get(func);

    if (call === undefined) {
      call = { args, timeout: null };
      this._debouncing.calls.set(func, call);
    }

    if (call.timeout !== null) {
      clearTimeout(call.timeout);
      call.timeout = null;
    }

    call.timeout = setTimeout(() => {
      this._debouncing.calls.delete(func);
      func(...args);
    }, this._debouncing.interval);
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
