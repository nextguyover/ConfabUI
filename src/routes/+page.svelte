<script>
	import ConfabSplash from "../splash.svelte";
	
	import { PUBLIC_API_URL } from "$env/static/public";
	import { onMount } from "svelte";

	var darkMode = false;
	$: refreshDarkMode(darkMode);
	const refreshDarkMode = (darkMode) => {
		try{
			document.body.style.backgroundColor = darkMode ? "#000" : "#FFF";
		} catch {}
	}
	onMount(() => refreshDarkMode(darkMode));
</script>

<button on:click={() => darkMode = !darkMode}>Toggle darkmode</button>
<br/><br/>
<ConfabSplash {PUBLIC_API_URL} {darkMode}/>