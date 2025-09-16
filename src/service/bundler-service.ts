import * as esbuild from 'esbuild-wasm';
import wasm from "../../node_modules/esbuild-wasm/esbuild.wasm";

export class BundlerService {
  private static instance: BundlerService;
  private initialized = false;

  private constructor() {}

  public static async getInstance(): Promise<BundlerService> {
    if (!BundlerService.instance) {
      BundlerService.instance = new BundlerService();
      await BundlerService.instance.init();
    }
    return BundlerService.instance;
  }

  private async init() {
    if (this.initialized) {
      return;
    }

    globalThis.performance = Date;

    await esbuild.initialize({
     wasmModule: wasm,
			worker: false,
    });
    this.initialized = true;
  }

  public async compile(code: string): Promise<string> {
    const result = await esbuild.build({
      bundle: true,
      minify: true,
      write: false,
      stdin: {
        contents: code,
        loader: "ts",
      },
      format: "esm",
      target: "es2022",
    });
    return result.outputFiles[0].text;
  }
}