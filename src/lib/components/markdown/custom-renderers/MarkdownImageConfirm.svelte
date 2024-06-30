<script>
    import MarkdownImageComponent from "./MarkdownImageComponent.svelte";

    export let href = "";
    export let title = undefined;
    export let text = "";
</script>

<MarkdownImageComponent {href} {title} {text} confirmImageUrl={true} />