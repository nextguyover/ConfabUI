<div class="wrapper">
    <div class="spacer"></div>
    <div class="quote"><slot></slot></div>
</div>

<style>
    .wrapper{
        display: flex;
        flex-direction: row;
    }
    .spacer{
        width: 4px;
        min-width: 4px;
        border-radius: 4px;
        margin: 12px 10px 12px 20px;

        background-color: var(--comment-color-grey-mid);
    }
</style>