// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
export const prerender = true;
export const ssr = true;

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
