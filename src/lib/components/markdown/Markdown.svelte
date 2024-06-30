<script>
	import SvelteMarkdown from "svelte-markdown";
	import MarkdownLinkComponent from "./custom-renderers/MarkdownLinkComponent.svelte";
	import MarkdownCodeBlockComponent from "./custom-renderers/MarkdownCodeBlockComponent.svelte";
	import MarkdownCodeInlineComponent from "./custom-renderers/MarkdownCodeInlineComponent.svelte";
	import MarkdownBlockquoteComponent from "./custom-renderers/MarkdownBlockquoteComponent.svelte";

	import MarkdownImage from "./custom-renderers/MarkdownImage.svelte";
	import MarkdownImageConfirm from "./custom-renderers/MarkdownImageConfirm.svelte";

    export let source = null;
    export let confirmImageUrl = false;
</script>

<SvelteMarkdown 
    source={source} 
    renderers={{ 
            image: confirmImageUrl ? MarkdownImageConfirm : MarkdownImage,
            link: MarkdownLinkComponent,
            code: MarkdownCodeBlockComponent,
            codespan: MarkdownCodeInlineComponent,
            blockquote: MarkdownBlockquoteComponent,
        }} 
/>