declare module 'cloudflare:workers' {
  export abstract class DurableObject<Env = any> {
    ctx: any;
    env: Env;
    constructor(ctx: any, env: Env);
  }
}
