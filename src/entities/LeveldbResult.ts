export interface LeveldbResult<T> {
    isExisted: boolean;
    record?: T;
}
