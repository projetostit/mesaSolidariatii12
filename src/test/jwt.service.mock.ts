export class JwtService {
  signAsync(): Promise<string> {
    return Promise.resolve('');
  }

  verifyAsync(): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }
}
