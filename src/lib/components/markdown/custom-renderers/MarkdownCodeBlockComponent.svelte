<script>
	import { onMount } from "svelte";

    import 'highlight.js/styles/felipec.css';

    export let lang = null;
    export let text;

    let codeBlockRef;
    let syntaxHighlighted = false;

    onMount(async () => {
        const hljs = (await import("highlight.js")).default;
        
        if((hljs.getLanguage(lang) || !lang)){
            hljs.highlightElement(codeBlockRef);
            syntaxHighlighted = true;
        }
    });
</script>

<div class="container">
    <pre><code class={(lang ? "language-" + lang : "") + " code-block"} bind:this={codeBlockRef}>{!syntaxHighlighted ? text : ""}</code></pre>
</div>

<style>
    .container{
        border-radius: 4px;
        overflow:hidden;
        margin: 10px 0;
    }
    pre{
        overflow-x:auto;
        background-color: #1e1e22;
        color: #dddde1;
        margin: 0;
        max-height: 500px;
    }
    .code-block{
        padding: 0;
        margin: 10px;
        display: inline-block;
        background-color: unset;
    }
    code{
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }
</style>