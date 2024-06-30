<script>
    export let tagType;
    import Fa from 'svelte-fa/src/fa.svelte'
    import { faUser } from '@fortawesome/free-solid-svg-icons'
</script>

<div class="comment-tag" class:comment-tag-is-author={tagType == "author"} class:comment-tag-admin={tagType == "admin"}>
    {#if tagType == "author"}
        <Fa icon={faUser} />
    {/if}
    {#if tagType == "admin"}
        Admin
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
</style>