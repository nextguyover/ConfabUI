<script>
    export let href = ''
    export let title = undefined

    let linkRef;
</script>
  
<a bind:this={linkRef} {href} {title}><slot></slot></a>
<span class="link-domain">({linkRef && linkRef.hostname})</span>

<style>
    .link-domain{
        font-size: 0.6em;
        transform: translateY(2px);
        display:inline-block;
    }
    
    a {
        color: var(--md-link-color);
    }
    a:visited {
        color: var(--md-link-visited-color);
    }
</style>