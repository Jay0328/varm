import { version } from '@mono/shared';

export function someCoreLogic() {
  if (__DEV__) {
    console.log(version);
  }

  return version.split('.');
}
