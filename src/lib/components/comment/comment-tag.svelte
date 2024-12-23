<script>
    export let tagType;
    import Fa from 'svelte-fa/src/fa.svelte'
    import { faUser, faUserSecret } from '@fortawesome/free-solid-svg-icons'
    import Tooltip from "../misc/tooltip.svelte";
</script>

<div class="comment-tag" 
    class:comment-tag-is-author={tagType == "author"} 
    class:comment-tag-admin={tagType == "admin"}
    class:comment-tag-anon={tagType == "anon"}
>
    {#if tagType == "author"}
        <Fa icon={faUser} />
    {/if}
    {#if tagType == "admin"}
        Admin
    {/if}
    {#if tagType == "anon"}
        <Tooltip tooltip="Anonymous User" tooltipEnabled={tagType == "anon"}>
            <Fa icon={faUserSecret} />
        </Tooltip>
    {/if}
</div>

<style>
    .comment-tag {
        padding: 4px;
        border-radius: 3px;
        color: aliceblue;
        display: inline-block;
        font-size: 0.7em;
        font-weight: 700;
    }

    .comment-tag-is-author {
        background-color: rgb(0, 89, 255);
    }

    .comment-tag-admin {
        background-color: rgb(189, 23, 23);
    }

    .comment-tag-anon {
        background-color: rgb(54, 54, 54);
    }
</style>