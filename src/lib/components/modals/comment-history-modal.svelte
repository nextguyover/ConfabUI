<script>
    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");

	import { faCircleNotch, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
	import Comment from "../comment/comment.svelte";
	import Fa from "svelte-fa/src/fa.svelte";
	import { getContext, onMount } from "svelte";
	import Markdown from "../markdown/Markdown.svelte";

	export let rootActions;
	export let userData;
	export let enabled;
	export let comment;

	let commentHistoryState = "pending"; //inactive, pending, ready, error
	let commentHistoryData;

	let unrenderTimeout;
	let renderTimeout;
	let modalRendered = false;
	let modalVisible = false;

	$: calcModalVisibility(enabled);

	function calcModalVisibility(setVal){
        if(setVal){
            modalRendered = true;

            clearTimeout(unrenderTimeout);
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                modalVisible = true;
            }, 10);
        }
        else{
            modalVisible = false;

            clearTimeout(renderTimeout);
            clearTimeout(unrenderTimeout);
            unrenderTimeout = setTimeout(() => {
                modalRendered = false;
            }, 300);
        }
    }

	$: updateCommentHistoryState(enabled);

    const updateCommentHistoryState = (dummyVar) => {
        if(enabled === true)
            commentHistoryState = "pending";
    }

	$: getCommentHistory(commentHistoryState);

	async function getCommentHistory(dummyVar) {
		if (commentHistoryState === "pending") {
			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/comment/history", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: comment.commentId,
					}),
				});
			} catch {} finally {
				if (response?.ok) {
					commentHistoryData = await response.json();
					commentHistoryData = commentHistoryData.sort((a, b) => (Date.parse(a.visibilityStartTime) > Date.parse(b.visibilityStartTime) ? -1 : 1));
					
					for(let historyItem of commentHistoryData){
						if(historyItem.beforeModeratorApproval){
							historyItem.lastBeforeApproval = true;
							break;
						}
					}

					commentHistoryState = "ready";
				} else {
					commentHistoryState = "error";
				}
			}
		}
	}

    onMount(() => {
        document.onkeydown = function(evt) {
            if (evt.key === "Escape") {
                enabled = false;
            }
        };
    })
</script>

{#if modalRendered}
	<div class="modal-background" role="presentation" on:click={() => (enabled = false)} class:modal-background-hidden={!modalVisible}>
		<div class="modal-container" 
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="Comment edit history"
            class:modal-container-hidden={!modalVisible}
        >
			<div class="modal-container-inner" role="presentation" on:click={(e) => e.stopPropagation()}>
				<div class="modal-close-btn" role="button" tabindex="0" on:click={() => (enabled = false)} on:keypress={() => (enabled = false)}>
					<Fa icon={faXmark} />
				</div>
				<div class="modal" role="presentation">
                    {#if comment}
					    <Comment {rootActions} {comment} {userData} isForDisplay={true} />
                    {/if}

					<div class="comment-history-container">
						{#if commentHistoryState == "pending"}
							Loading History...
							<div class="comment-history-state-icon">
								<Fa icon={faCircleNotch} spin size="2x" />
							</div>
						{:else if commentHistoryState == "error"}
							There was an error loading history. Try again later.
							<div class="comment-history-state-icon">
								<Fa icon={faTriangleExclamation} size="2x" />
							</div>
						{:else if commentHistoryState == "ready"}
							Comment edit history:
							<div class="comment-history-element-container">
								{#each commentHistoryData as historyDataElement (historyDataElement.visibilityStartTime)}
								{#if historyDataElement.lastBeforeApproval}
									<span class="comment-history-before-approval-divider">--- Approved by Moderator ---</span>
								{/if}
								<div class="comment-history-element">
										<div class="comment-history-element-top-row">
											<div>
												{new Date(Date.parse(historyDataElement.visibilityStartTime)).toLocaleString()}
											</div>

											<div>
												{rootActions.formatTimeAgo(Date.parse(historyDataElement.visibilityStartTime))}
											</div>
										</div>
										<div class="comment-history-text">
											<Markdown source={historyDataElement.content} confirmImageUrl={historyDataElement.beforeModeratorApproval || comment.awaitingModeration} />
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-background {
		--modal-border-radius: 4px;

		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.322);
		z-index: 100;

        backdrop-filter: blur(2px);
        transition-property: opacity;
        transition-duration: 0.3s;
	}
    
    .modal-background-hidden {
        opacity: 0;
        pointer-events: none;
    }

	.modal-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;

        transition: transform 0.3s;
	}

    .modal-container-hidden {
        transform: scale(0.98);
    }

	.modal-container-inner {
		margin: 20px;
		background-color: var(--background-color-modal);
		padding: 20px;
		border-radius: var(--modal-border-radius);
		max-width: 100vw;
		position: relative;
		padding-top: 40px;
	}

	.modal {
		max-height: calc(100vh - 80px);
		overflow-y: auto;
		max-width: min(calc(100vw - 80px), 800px);
        min-width: min(70vw, 500px);
		text-overflow: clip;
		white-space: normal;
		word-wrap: break-word;
	}

	.comment-history-container {
		padding: 20px 0 0 0;
	}

	.comment-history-state-icon {
		padding: 20px 0 20px 0;
		display: flex;
		justify-content: center;
		color: var(--comment-color-grey-dark);
	}

	.comment-history-element {
		background-color: var(--background-color);
		margin: 10px 0 0 0;
		padding: 10px;
		border-radius: 4px;
	}

	.comment-history-element-top-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20px;
		padding-bottom: 6px;
		border-bottom: var(--outline-color-grey-dark) 1px solid;
	}

	.modal-close-btn {
		position: absolute;
		top: 0;
		right: 0;
		width: 30px;
		aspect-ratio: 1/1;
		background-color: var(--comment-color-grey);
		transition: background-color 0.2s;
		border-radius: 0 var(--modal-border-radius) 0 var(--modal-border-radius);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.modal-close-btn:hover {
		background-color: color-mix(in srgb, var(--comment-color-grey), #FFF 3%);
	}

	.comment-history-text {
		margin-top: -16px;
		margin-bottom: -16px;
	}

	.comment-history-before-approval-divider{
		display:block; 
		padding-top: 10px;
		text-align: center;
	}
</style>
