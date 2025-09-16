declare module "*.wasm" {
	const value: WebAssembly.Module;
	export default value;
}

declare namespace globalThis {
    var performance: typeof Date;
}