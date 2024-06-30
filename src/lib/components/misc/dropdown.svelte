<script>
	import Fa from "svelte-fa/src/fa.svelte";
    import { faSort } from "@fortawesome/free-solid-svg-icons";
	import { onMount } from "svelte";

    export let items;
    export let value;
    export let onChange = null;

    let containerRef;
    let containerOptionsRef;

    let optionsHidden = true;

    const selectItem = (newValue) => {
        value = newValue;
        optionsHidden = true;
        if(onChange) onChange();
    }

    onMount(() => {
        containerRef.style.setProperty(`--options-max-height`, containerOptionsRef.offsetHeight + 50);
    })
</script>

<div bind:this={containerRef} class="dropdown-container" role="presentation" on:mouseleave={() => optionsHidden = true}>
    <div class="dropdown"  role="button" tabindex="0" on:click={() => optionsHidden = !optionsHidden} on:keypress={() => optionsHidden = !optionsHidden}>
        <div class="dropdown-text">
            {items.find(obj => {
                return obj.value === value;
            }).label}
        </div>
        
        <div class="dropdown-arrow">
            <div class="dropdown-arrow-icon">
                <Fa icon={faSort} />
            </div>
        </div>
    </div>
    
    <div class="dropdown-options-container" class:dropdown-options-container-hidden={optionsHidden}>
        <div class="dropdown-options" bind:this={containerOptionsRef}>
            {#each items as item}
                <div class="dropdown-options-item" class:dropdown-options-item-selected={item.value === value} role="button" tabindex={optionsHidden ? "-1" : "0"} on:click={() => selectItem(item.value)} on:keypress={() => selectItem(item.value)}>
                    <div class="dropdown-options-item-text">
                        {item.label}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
	.dropdown-container {
        --color-background: var(--dropdown-background);
        --color-muted: var(--outline-color-grey-dark);
        --color-muted-2: #b4b4b4;
        --dropdown-border-radius: 4px;
        --options-max-height: 200px;

        display: inline-block;
        width: 100%;
        height: 2em;
        background-color: var(--color-background);
        outline: var(--color-muted) 1px solid;
        border-radius: var(--dropdown-border-radius);
        position: relative;
        user-select: none;
	}
    
    .dropdown {
        height: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;
        justify-content: space-between;
    }

    .dropdown-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 5px 0 5px;
        text-align: center;
        flex-grow: 1;
    }

    .dropdown-arrow {
        display: flex;
        align-items: center;
        color: var(--color-muted-2);
        border-left: var(--color-muted) solid 1px;
    }

    .dropdown-arrow-icon {
        padding: 0 10px;
    }

    .dropdown-options-container {
        --containerOptionsHeight: 40px;
        width: 100%;
        position: absolute;
        background-color: var(--color-background);
        border-radius: var(--dropdown-border-radius);
        overflow: hidden;
        max-height: calc(var(--options-max-height) * 1px);
        transition: max-height 0.3s;
        z-index: 1;
    }
    
    .dropdown-options-container-hidden {
        max-height: 0;
    }

    .dropdown-options {
        text-align: center;
        border: var(--color-muted) 1px solid;
        border-radius: var(--dropdown-border-radius);
    }

    .dropdown-options-item {
        width: 100%;
        padding: 5px 0;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .dropdown-options-item:hover {
        background-color: var(--dropdown-highlight);
    }

    .dropdown-options-item-selected {
        background-color: var(--dropdown-select);
    }
</style>
