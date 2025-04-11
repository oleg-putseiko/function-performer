import isDeepEqual from 'fast-deep-equal';

type Timeout = ReturnType<typeof setTimeout>;

type DeduplicatedFunction = (count: number, ...args: any[]) => any;

type FunctionCall = {
  count: number;
  args: unknown[];
  timeout: Timeout | null;
};

type Deduplication = {
  calls: Map<DeduplicatedFunction, FunctionCall[]>;
  interval: number;
};

type DeduplicationConfig = {
  interval?: number;
};

type PerformerConfig = {
  deduplication?: DeduplicationConfig;
};

export class Performer {
  private readonly _deduplication: Deduplication;

  constructor(config?: PerformerConfig) {
    this._deduplication = {
      calls: new Map<DeduplicatedFunction, FunctionCall[]>(),
      interval: config?.deduplication?.interval ?? 0,
    };
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
