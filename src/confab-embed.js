import ConfabSplash from './splash.svelte';

var Confab;

export function main(container, shadowRoot, dispatchEventLightDom, darkModeInitial, apiUrl){
	Confab = new ConfabSplash({
		target: container,
		props: { 
			PUBLIC_API_URL: apiUrl,
			shadowRoot: shadowRoot,
			dispatchEventLightDom : dispatchEventLightDom,
			darkMode: darkModeInitial
		},
	});
}

export function setDarkMode(mode){
	Confab.$set({darkMode: mode});
}