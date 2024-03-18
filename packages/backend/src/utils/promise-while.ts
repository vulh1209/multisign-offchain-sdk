import Bluebird from 'bluebird';

type ConditionFunc<T> = (value: T) => boolean;
type ActionFunc<T> = (value: T) => Promise<T>;

export const promiseWhile = <T>(
  condition: ConditionFunc<T>,
  action: ActionFunc<T>,
  initialValue: T,
): Promise<T> =>
  Bluebird.method<T, ConditionFunc<T>, ActionFunc<T>, T>(async function fn(
    _condition,
    _action,
    _initialValue,
  ): Promise<T> {
    const value = await _action(_initialValue);
    if (!_condition(value)) return value;
    return fn(_condition, _action, value);
  })(condition, action, initialValue);
