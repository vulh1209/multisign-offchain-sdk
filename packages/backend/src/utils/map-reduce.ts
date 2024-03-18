type ValueGetterFunc<T, R> = (item: T) => R;

const defaultValueGetter = (): any => true;

export const mapReduce = <T extends { [key in F]?: any }, F extends string, R = boolean>(
  data: T[],
  field: F,
  valueGetter: ValueGetterFunc<T, R> = defaultValueGetter,
): { [key: string]: R } =>
  data.reduce<{ [key: string]: R }>((all, item) => {
    const key = item[field]?.toString();
    if (key) all[key] = valueGetter(item);
    return all;
  }, {});
