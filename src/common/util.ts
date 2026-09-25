export function handleError(methodName: string) {
  function _handleError (err: Error | undefined): void {
    if (err) {
      console.error('An error ocurred when sending a method response:\n' + err.toString());
    } else {
      console.log('Response to method "%s" sent successfully.', methodName);
    }
  }
  return _handleError
}
