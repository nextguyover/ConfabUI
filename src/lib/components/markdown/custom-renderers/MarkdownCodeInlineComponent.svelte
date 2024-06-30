<script>
    export let raw
</script>
  
<span class="code-container"><code>{raw.replace(/`/g, '')}</code></span>

<style>
    code{
        font-size: 1.1em;
        margin-inline-start: 4px;
        margin-inline-end: 4px;
    }

    .code-container{
        border-radius: 4px;
        background-color: #1e1e22;
        color: #dddde1;
        font-size: 0.9em;
    }
    code{
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
    }
</style>