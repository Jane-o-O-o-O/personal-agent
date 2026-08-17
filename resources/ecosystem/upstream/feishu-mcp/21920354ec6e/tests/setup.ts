jest.mock('@larksuiteoapi/node-sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      request: jest.fn(),
      im: {
        message: {
          create: jest.fn(),
        },
        chat: {
          create: jest.fn(),
          list: jest.fn(),
        },
      },
    })),
    withUserAccessToken: jest.fn((token) => ({ userAccessToken: token })),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
