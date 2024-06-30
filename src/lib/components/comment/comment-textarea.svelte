<script>
    import autosize from 'svelte-autosize';

    import Fa from "svelte-fa/src/fa.svelte";
	import { faBold, faCode, faFileCode, faHeading, faImage, faItalic, faLink, faListOl, faListUl, faMinus, faQuoteLeft, faRedo, faStrikethrough, faTable, faUndo } from "@fortawesome/free-solid-svg-icons";
	import Tooltip from '../misc/tooltip.svelte';

    export let newReplyContent;
    export let newReplyPending;

    let tooltipDelayMs = 700;

    let activeToolTips = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    let anyTooltipActive = false;

    $: getAnyTooltipActive(activeToolTips);

    let tooltipInactiveTimeout;
    const getAnyTooltipActive = (activeToolTips) => {
        for(const tooltip of activeToolTips){
            if(tooltip === true){
                clearTimeout(tooltipInactiveTimeout);
                anyTooltipActive = true;
                return;
            }
        }
        tooltipInactiveTimeout = setTimeout(() => {
            anyTooltipActive = false;
        }, 1000);
    }

    let textareaRef;

    const editorActions = (e, action) => {
        e.preventDefault();

        var start = textareaRef.selectionStart;
        var finish = textareaRef.selectionEnd;
        var selection = newReplyContent.substring(start, finish);

        let splitByDoubleNewLine = true;
        switch(action){
            case "codeblock": 
            case "divider": 
            case "list_ol": 
            case "list_ul": 
            case "table": 
            case "undo": 
            case "redo": 
                splitByDoubleNewLine = false;
        }

        let selectionSplitByDoubleNewLine = selection.split("\n\n");
        if(selectionSplitByDoubleNewLine.length == 0) selectionSplitByDoubleNewLine = [""]

        let textToReplace = "";

        for(let i = 0; i < (splitByDoubleNewLine ? selectionSplitByDoubleNewLine.length : 1); i++){
            let selectionLine;
            if(splitByDoubleNewLine){
                selectionLine = selectionSplitByDoubleNewLine[i];
                if(selectionLine.replace(/^[\s\n]*/, '') == "" && selectionSplitByDoubleNewLine.length > 1){
                    continue;
                }
                if(i !== selectionSplitByDoubleNewLine.length - 1){
                    selectionLine +="\n\n";
                }
            } else {
                selectionLine = selection;
            }

            let startMatch = selectionLine.match(/^[\s\n]*/);
            let startSpaces = startMatch ? startMatch[0] : '';
            
            selectionLine = selectionLine.replace(/^[\s\n]*/, '');
            
            let endMatch = selectionLine.match(/[\s\n]*$/);
            let endSpaces = endMatch ? endMatch[0] : '';
            
            selectionLine = selectionLine.replace(/[\s\n]*$/, '');

            textareaRef.focus();

            switch(action){
                case "bold":
                    textToReplace += startSpaces + "__" + selectionLine + "__" + endSpaces;
                    break;
                case "italic":
                    textToReplace += startSpaces + "*" + selectionLine + "*" + endSpaces;
                    break;
                case "strikethrough":
                    textToReplace += startSpaces + "~" + selectionLine + "~" + endSpaces;
                    break;
                case "header":
                    if(selectionSplitByDoubleNewLine.length == 1){
                        textToReplace += startSpaces +"\n\n# " + selectionLine + "\n\n";
                    } else {
                        textToReplace += startSpaces +"\n# " + selectionLine + "\n";
                    }
                    break;
                case "divider":
                    document.execCommand("insertText", false, startSpaces + selectionLine + "\n\n---\n");
                    break;
                case "quote":
                    if(selectionSplitByDoubleNewLine.length == 1){
                        textToReplace += startSpaces + "\n\n> " + selectionLine + "\n\n";
                    } else {
                        textToReplace += startSpaces + "\n> " + selectionLine + "\n";
                    }
                    break;
                case "link":
                    textToReplace += startSpaces + "[" + selectionLine + "](url)" + endSpaces;
                    break;
                case "code_inline":
                    textToReplace += startSpaces + "`" + selectionLine + "`" + endSpaces;
                    break;
                case "image":
                    textToReplace += startSpaces + "![](" + selectionLine + ")" + endSpaces;
                    break;
                case "codeblock":
                    // document.execCommand("insertText", false, startSpaces + (startSpaces == "\n\n" ? "" : (startSpaces == "\n" ? "\n" : "\n\n")) + "```\n" + selectionLine + "\n```\n\n");
                    document.execCommand("insertText", false, startSpaces+ "\n\n```\n" + selectionLine + "\n```\n\n");
                    break;
                case "list_ol":
                    document.execCommand("insertText", false, startSpaces + "\n\n 1. " + selectionLine + "\n\n");
                    break;
                case "list_ul":
                    document.execCommand("insertText", false, startSpaces + "\n\n - " + selectionLine + "\n\n");
                    break;
                case "table":
                    document.execCommand("insertText", false, startSpaces + "\n\n|   |   |\n|---|---|\n|   |   |\n\n" + selectionLine + endSpaces);
                    break;
                case "undo":
                    document.execCommand("undo", false);
                    break;
                case "redo":
                    document.execCommand("redo", false);
                    break;
            }
        }

        document.execCommand("insertText", false, textToReplace);
    }
</script>

<div class="content">
    <textarea class="content-textarea" use:autosize bind:this={textareaRef} bind:value={newReplyContent} readonly={newReplyPending}/>
    <div class="content-btn-row">
        <div class="content-btn-row-inner">
            <div class="content-btn-row-section">
                <Tooltip tooltip="Bold" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[0]}>
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "bold")} on:keypress={(e) => editorActions(e, "bold")}>
                        <Fa icon={faBold}/>
                    </div>
                </Tooltip>
                
                <Tooltip tooltip="Italic" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[1]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "italic")} on:keypress={(e) => editorActions(e, "italic")}>
                        <Fa icon={faItalic}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Strikethrough" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[2]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "strikethrough")} on:keypress={(e) => editorActions(e, "strikethrough")}>
                        <Fa icon={faStrikethrough}/>
                    </div>
                </Tooltip>
                <div class="content-btn-spacer"/>
            </div>
            <div class="content-btn-row-section">
                <Tooltip tooltip="Heading" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[3]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "header")} on:keypress={(e) => editorActions(e, "header")}>
                        <Fa icon={faHeading}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Divider" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[4]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "divider")} on:keypress={(e) => editorActions(e, "divider")}>
                        <Fa icon={faMinus}/>
                    </div>
                </Tooltip>
                <div class="content-btn-spacer"/>
            </div>
            <div class="content-btn-row-section">
                
                <Tooltip tooltip="Quote" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[5]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "quote")} on:keypress={(e) => editorActions(e, "quote")}>
                        <Fa icon={faQuoteLeft}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Link" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[6]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "link")} on:keypress={(e) => editorActions(e, "link")}>
                        <Fa icon={faLink}/>
                    </div>
                </Tooltip>
                <div class="content-btn-spacer"/>
            </div>
            <div class="content-btn-row-section">
                
                <Tooltip tooltip="Inline Code" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[7]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "code_inline")} on:keypress={(e) => editorActions(e, "code_inline")}>
                        <Fa icon={faCode}/>
                    </div>
                </Tooltip>
                
                <Tooltip tooltip="Code Block" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[8]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "codeblock")} on:keypress={(e) => editorActions(e, "codeblock")}>
                        <Fa icon={faFileCode}/>
                    </div>
                </Tooltip>
                <div class="content-btn-spacer"/>
            </div>
            <div class="content-btn-row-section">
                <Tooltip tooltip="Ordered List" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[9]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "list_ol")} on:keypress={(e) => editorActions(e, "list_ol")}>
                        <Fa icon={faListOl}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Un-ordered List" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[10]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "list_ul")} on:keypress={(e) => editorActions(e, "list_ul")}>
                        <Fa icon={faListUl}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Table" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[11]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "table")} on:keypress={(e) => editorActions(e, "table")}>
                        <Fa icon={faTable}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Image" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[12]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "image")} on:keypress={(e) => editorActions(e, "image")}>
                        <Fa icon={faImage}/>
                    </div>
                </Tooltip>
            </div>
        </div>
        
        <div class="content-btn-row-inner">
            <div class="content-btn-row-section">
                <Tooltip tooltip="Undo" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[13]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "undo")} on:keypress={(e) => editorActions(e, "undo")}>
                        <Fa icon={faUndo}/>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Redo" showAfterDelayMs={anyTooltipActive ? false : tooltipDelayMs} bind:tooltipCurrentlyActive={activeToolTips[14]} >
                    <div class="content-btn" role="button" tabindex="0" on:click={(e) => editorActions(e, "redo")} on:keypress={(e) => editorActions(e, "redo")}>
                        <Fa icon={faRedo}/>
                    </div>
                </Tooltip>  
            </div>
        </div>
    </div>
</div>

<style>
    .content {
		--btn-color: var(--comment-color-grey-darker);
		--btn-spacer-color: #aaaaaa;
		--btn-size: 25px;
    }

	.content-textarea {
		border: 1px solid var(--outline-color-grey-dark);
        width: 100%;  
        box-sizing: border-box;
		resize: none;
		border-radius: 4px 4px 0 0;
		border-bottom: none;
		min-height: 5em;
        padding: 10px;
		font-size: 16px;
		font: inherit;
		transition: background-color 0.2s;
        font-family: 'JetBrains Mono', monospace;
		background-color: var(--textarea-background);
        color: var(--text-color); 
	}

	.content-textarea:focus {
		outline: none;
	}

	.content-textarea:read-only {
		background-color: var(--comment-color-grey-dark);
	}

	.content-btn-row {
        width: 100%;  
        box-sizing: border-box;
		margin-top: -8px;
		border: 1px solid var(--outline-color-grey-dark);
		border-radius: 0 0 4px 4px;
		border-top: none;
		border-bottom: none;
        padding: 0 3px;
        padding-top: 2px;
        background-image: linear-gradient(
            0deg,
            var(--comment-color-grey-mid) 0%,
            var(--textarea-background) 38%,
            var(--textarea-background) 82%
        );
        display: flex;
        justify-content: space-between;
	}

	.content-btn-row-inner {
        padding: 3px 0;
		display: flex;
        flex-wrap: wrap;
    }
    
    .content-btn-row-section {
        display: flex;
        align-items: center;
    }

	.content-btn {
		display:flex;
		justify-content: center;
		flex-direction: column;
		width: var(--btn-size);
		aspect-ratio: 1/1;
        border-radius: 4px;
        color: var(--btn-color);
        transition: background-color 0.2s;
        user-select: none;
	}
    
	.content-btn:hover {
        background-color: var(--comment-color-grey);
        cursor: pointer;
    }

    .content-btn-spacer {
        height: calc(var(--btn-size) - 8px);
        margin: 0px 8px;
        border-left: var(--btn-spacer-color) 1px solid;
        border-radius: 2px;
    }

    @media (max-width: 500px) {
        .content-textarea {
			font-size: 0.92em;
        }
    }

</style>