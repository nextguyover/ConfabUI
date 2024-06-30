<script>
    import Loading from "$lib/components/misc/loading.svelte";
    export let PUBLIC_API_URL;
	export let dispatchEventLightDom = null;
	export let shadowRoot = null;
	export let darkMode;
</script>

{#await import("./Confab.svelte")}
    <div class="splash-container" class:dark={darkMode}>
		<div class="splash">
            <Loading/>
        </div>
    </div>
{:then Confab}
    <Confab.default {PUBLIC_API_URL} {shadowRoot} {dispatchEventLightDom} {darkMode}/>
{:catch error}
    There was an error loading Confab!
    <p style="color: red">{error.message}</p>
{/await}

<style>
    .splash-container {
        background-color: #f9f9f9;
        outline: 1px solid #d8d8d8;
        border-radius: 4px;
    }

    .dark {
        background-color: #1a1a1a;
        outline: 1px solid #3a3a3a;
        color: #fff;
    }

    .splash {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px 20px;
    }
</style>