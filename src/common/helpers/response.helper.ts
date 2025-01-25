export const responseSuccess = (
  metaData = null,
  message = `Thành công`,
  code = 200,
) => {
  return {
    status: `success`,
    code: code,
    message: message,
    metaData: metaData,
    doc: `https://tuananhdev.click`,
  };
};

export const responseError = (
  message = 'Internal Server Error',
  code = 500,
  stack = null,
) => {
  return {
    status: `error`,
    code: code,
    message: message,
    stack: stack,
  };
};
