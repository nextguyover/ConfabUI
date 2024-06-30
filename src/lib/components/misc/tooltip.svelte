<script>
    export let tooltip;
    export let showAfterDelayMs = false;
    export let forceShowTooltip = false;
    export let tooltipCurrentlyActive = false;

    $: tooltipCurrentlyActive = tooltipRendered && tooltipVisible && showDelayComplete;

    let showTooltip = false;

    $: prevTooltipVal = tooltip ? tooltip : prevTooltipVal;

    let tooltipVisible;
    
    let tooltipRendered = false;
    $: calcTooltipVisibility((showTooltip && tooltip) || forceShowTooltip);

    let unrenderTimeout;
    let renderTimeout;

    let showDelayTimeout;
    $: showDelayComplete = showAfterDelayMs === false ? true : false;

    function calcTooltipVisibility(setVal){
        if(setVal){
            tooltipRendered = true;

            clearTimeout(unrenderTimeout);
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                tooltipVisible = true;
            }, 10);

            if(showAfterDelayMs !== false){
                clearTimeout(showDelayTimeout);
                showDelayTimeout = setTimeout(() => {
                    showDelayComplete = true;
                }, showAfterDelayMs);
            }
        }
        else{
            tooltipVisible = false;

            clearTimeout(renderTimeout);
            clearTimeout(unrenderTimeout);
            unrenderTimeout = setTimeout(() => {
                tooltipRendered = false;
            }, 200);

            clearTimeout(showDelayTimeout);
            if(showAfterDelayMs !== false){
                showDelayComplete = false;
            }
        }
    }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div role="presentation" class="tooltip-container-outer"
on:mouseover={() => showTooltip = true} 
on:mouseleave={() => showTooltip = false} 
on:focusin={() => showTooltip = true}
on:focusout={() => showTooltip = false} >
	<slot></slot>

    {#if tooltipRendered}
        <div class="tooltip-container">
            <div class="tooltip" class:tooltip-hidden={!(tooltipVisible && showDelayComplete)}>            
                <div class="tooltip-content">
                    {tooltip ? tooltip : prevTooltipVal}
                </div>
            </div>
        </div>
    {/if}
</div>


<style>
    .tooltip-container-outer {
        --tooltip-anim-duration: 0.2s;
        --tooltip-color: rgb(51, 51, 51);
        --tooltip-text-color: rgb(209, 209, 209);
        --tooltip-text-size: 0.8em;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tooltip-container {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .tooltip{
        position: absolute;
        top: 25px;
        background-color: var(--tooltip-color);
        padding: 5px 10px;
        border-radius: 4px;
        z-index: 300;
        color: var(--tooltip-text-color);
        font-size: var(--tooltip-text-size);
        text-align: center;
        pointer-events: none;
        overflow-wrap:break-word; 
        white-space:nowrap;

        transition-property: opacity, transform;
        transition-duration: var(--tooltip-anim-duration);
    }

    .tooltip::before {
        --arrow-size: 7px;

        content: "";
        position: absolute;
        left: calc(50% - var(--arrow-size));
        top: calc(calc(-2 * var(--arrow-size)) + 1px);
        border-width: var(--arrow-size);
        border-style: solid;
        border-color: transparent transparent var(--tooltip-color) transparent;
        pointer-events: none;
    }

    .tooltip-hidden {
        opacity: 0;
        transform: translateY(10px);
    }
</style>