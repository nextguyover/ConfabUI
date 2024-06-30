<script>
    import Fa from "svelte-fa/src/fa.svelte";
	import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
    
    export let data;

    $: selectedOption = getSelectedOption(data)

    const getSelectedOption = (newData) => {
        for(let option of newData.options){
            if(option.btnSelected){
                return option;
            }
        }
    }

</script>

<div class="panel-row-item panel-row-item-small">
    <div class="panel-row-item-heading">{data.title}</div>
    <div class="panel-row-item-icon" style={(!data.currentlyLoading && selectedOption) ? "color: " + selectedOption.centralIconColor + ";" : ""}>
        {#if !data.currentlyLoading && selectedOption}
            <Fa icon={selectedOption.centralIcon} />
        {:else}
            <Fa icon={faCircleNotch} spin />
        {/if}
    </div>
    <div class="panel-row-item-text">
        {#if selectedOption && !data.currentlyLoading}
            {selectedOption.optionText}
        {:else}
            Loading
        {/if}
    </div>
    <div class="panel-row-item-btn-row">
        {#each data.options as option}
            {#if option.btnIcon !== null}
                <button class="panel-row-item-btn" on:click={option.btnPressAction} class:panel-row-item-btn-selected={option.btnSelected}><Fa icon={option.btnIcon} /></button>
            {/if}
        {/each}
    </div>
</div>

<style>
    .panel-row-item {
        display:flex;
        align-items: center;
        flex-direction: column;

        outline: 1px solid var(--outline-color-grey);
        border-radius: 4px;
        padding: 10px;
        margin: 10px 10px;
    }
    
    .panel-row-item-small {
        width: 110px;
    }

    .panel-row-item-heading {
        text-align: center;
        font-weight: 600;
        height: 3em;
        display: flex;
        align-items: center;
    }

    .panel-row-item-icon {
        font-size: 3em;
        color: var(--comment-color-grey-dark);
    }

    .panel-row-item-text {
        text-transform: capitalize;
    }

    .panel-row-item-btn-row {
        display:flex;
    }

    .panel-row-item-btn {
        padding: 3px;
        border-radius: 4px;
        margin: 3px;
        user-select: none;
        cursor: pointer;
        color: var(--comment-color-grey-dark);
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 25px;
        height: 25px;
        background-color: transparent;

        transition: background-color 0.2s;
    }

    .panel-row-item-btn:hover {
        background-color: var(--comment-color-grey);
    }

    .panel-row-item-btn-selected {
        background-color: color-mix(in srgb, var(--comment-color-grey), var(--comment-color-grey-dark) 10%);
    }
</style>