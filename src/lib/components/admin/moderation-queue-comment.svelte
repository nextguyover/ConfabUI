<script>
	import Fa from "svelte-fa/src/fa.svelte";
    import { faPencil, faSpinner, faCheck, faTrashCan, faFireFlameCurved, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

	import Tooltip from "../misc/tooltip.svelte";

    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");
	import { getContext, onMount } from "svelte";
	import Markdown from "../markdown/Markdown.svelte";

    export let rootActions;
    
    export let isParent = false;
    export let id;
    export let creationTime;
    export let content;
    export let editTime = null;
    export let authorId;
    export let authorUsername;
    export let location;

    export let refreshQueueAction = null;

    export let deletedAuthorId;
    export let permaDeleteAllModQueueSetUserId;

    let commentOutcome = null;
    
    let contentHeight;

    let contentCollapsed = false;
    onMount(() => {
        if(isParent && contentHeight > 100) contentCollapsed = true;
    });

    let modApprovePending = false;

	const modApprove = async () => {
		if(!modApprovePending){
			modApprovePending = true;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/moderation-accept", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: id,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				modApprovePending = false;
                removeComment(true);
			}
		}
	}


	let permaDeletePending = false;
	let confirmPermaDelete = false;
	let confirmPermaDeleteTimeout;

	const permaDeleteComment = async () => {
		if(!permaDeletePending){
			if(!confirmPermaDelete){
				confirmPermaDelete = true;

				clearTimeout(confirmPermaDeleteTimeout);
				confirmPermaDeleteTimeout = setTimeout(() => {
					confirmPermaDelete = false;
				}, 3000);
				return;
			}
			
			permaDeletePending = true;
			confirmPermaDelete = false;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/permanently-delete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: id,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				permaDeletePending = false;
                removeComment(false);
			}
		}
	}
	
	let permaDeleteAllModQueuePending = false;
	let confirmPermaDeleteAllModQueue = false;
	let confirmPermaDeleteAllModQueueTimeout;

	const permaDeleteAllModQueue = async () => {
		if(!permaDeleteAllModQueuePending){
			if(!confirmPermaDeleteAllModQueue){
				confirmPermaDeleteAllModQueue = true;

				clearTimeout(confirmPermaDeleteAllModQueueTimeout);
				confirmPermaDeleteAllModQueueTimeout = setTimeout(() => {
					confirmPermaDeleteAllModQueue = false;
				}, 3000);
				return;
			}
			
			permaDeleteAllModQueuePending = true;
			confirmPermaDeleteAllModQueue = false;

			let response;
			try {
				response = await fetch(PUBLIC_API_URL + "/admin/comment/moderation-permanently-delete-all", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + localStorage.getItem("jwtToken"),
					},
					body: JSON.stringify({
						id: authorId,
					}),
				});
			} catch{} finally {
				if (response?.ok) {
					await rootActions.refreshComments();
				}
				permaDeleteAllModQueuePending = false;
                permaDeleteAllModQueueSetUserId(authorId)
                removeComment(false);
			}
		}
	}

    const goToComment = () => {
        window.location.href = window.location.origin + location + "#" + id;
    }

    const removeComment = (accepted) => {
        commentOutcome = accepted;

        setTimeout(() => {
            refreshQueueAction();
        }, 2000);
    }

    $: commentActioned = commentOutcome === true || (commentOutcome === false || deletedAuthorId == authorId)
</script>

<div class="comment-container">
    <div class="comment" class:parent-comment={isParent} class:comment-awaiting-approval={!isParent} class:comment-accept={commentOutcome === true} class:comment-delete={commentOutcome === false || deletedAuthorId == authorId}>
        <div class="top-row">
            <div class="profile-info">
                <img class="profile-pic" src={PUBLIC_API_URL + "/user/get-profile-picture/" + authorId} alt="Profile" />
                <span class="username">{authorUsername}</span>
            </div>
            <div class="timestamp">
                {rootActions.formatTimeAgo(Date.parse(creationTime))}
                {#if editTime}
                    <div class="timestamp-edit">
                        <Fa icon={faPencil} /> {rootActions.formatTimeAgo(Date.parse(editTime))}
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="content" bind:clientHeight={contentHeight} class:content-collapsed={contentCollapsed} role="button" tabindex="0" on:click={() => contentCollapsed = false} on:keypress={() => contentCollapsed = false}>
            <Markdown source={content} confirmImageUrl={!isParent} />
        </div>

        {#if !isParent && !commentActioned}
        <div class="button-row">
            <div class="button-row-inner">
                <Tooltip tooltip="Approve">
                    <div role="button" tabindex={0} on:click={modApprove} on:keypress={modApprove} class="comment-btn-icon-container">
                        <div class="comment-btn-icon">
                            <div class="comment-btn-icon-inner">
                                {#if modApprovePending}
                                    <Fa icon={faSpinner} spin/>
                                {:else}
                                    <Fa icon={faCheck} />
                                {/if}
                            </div>
                        </div>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Permanently Delete">
                    <div role="button" tabindex={0} on:click={permaDeleteComment} on:keypress={permaDeleteComment} on:mouseleave={() => confirmPermaDelete = false} on:focusout={() => confirmPermaDelete = false} class="comment-btn-icon-container" class:comment-btn-error={confirmPermaDelete}>
                        <div class="comment-btn-icon">
                            <div class="comment-btn-icon-inner" class:delete-confirm={confirmPermaDelete}>
                                {#if permaDeletePending}
                                    <Fa icon={faSpinner} spin/>
                                {:else}
                                    {#if confirmPermaDelete}
                                        <Fa icon={faTrashCan} size="1.2x" />
                                    {:else}
                                        <Fa icon={faTrashCan} />
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    </div>
                </Tooltip>
                <Tooltip tooltip="Permanently Delete User's All Pending Comments">
                    <div role="button" tabindex={0} on:click={permaDeleteAllModQueue} on:keypress={permaDeleteAllModQueue} on:mouseleave={() => confirmPermaDeleteAllModQueue = false} on:focusout={() => confirmPermaDeleteAllModQueue = false} class="comment-btn-icon-container" class:comment-btn-error={confirmPermaDeleteAllModQueue}>
                        <div class="comment-btn-icon">
                            <div class="comment-btn-icon-inner" class:delete-confirm={confirmPermaDeleteAllModQueue}>
                                {#if permaDeleteAllModQueuePending}
                                    <Fa icon={faSpinner} spin/>
                                {:else}
                                    {#if confirmPermaDeleteAllModQueue}
                                        <Fa icon={faFireFlameCurved} size="1.2x" />
                                    {:else}
                                        <Fa icon={faFireFlameCurved} />
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    </div>
                </Tooltip>
            </div>
            <div class="button-row-inner">
                <div role="button" tabindex={0} on:click={() => goToComment()} on:keypress={() => goToComment()} class="comment-btn-icon-container" >
                    <div class="comment-btn-icon">
                        <div class="comment-btn-icon-inner">
                            <Fa icon={faArrowUpRightFromSquare} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/if}
    </div>
</div>

<style>
    .comment-container{
		--comment-color-background: color-mix(in srgb, var(--background-color), var(--comment-color-grey) 40%);
    }

    .comment {
        background-color: var(--comment-color-background);
        padding: 5px;
        margin: 5px;
        border-radius: 4px;
        font-size: 0.9em;
        transition: background-color 0.3s;
    }

    .comment-awaiting-approval {
		--stripe-dark: color-mix(in srgb,var(--comment-color-background), color-mix(in srgb, var(--comment-color-grey), rgb(17, 33, 121) 30%) 25%);
		--stripe-light: var(--comment-color-background);
		background: linear-gradient(135deg, var(--stripe-light) 25%, var(--stripe-dark) 25%, var(--stripe-dark) 50%, var(--stripe-light) 50%, var(--stripe-light) 75%, var(--stripe-dark) 75%, var(--stripe-dark));
  		background-size: 15px 15px;
    }

    .comment-delete {
        background: none;
        background-color: color-mix(in srgb,var(--comment-color-background),red 30%);
    }

    .comment-accept {
        background: none;
        background-color: color-mix(in srgb,var(--comment-color-background),rgb(21, 180, 21) 30%);
    }

    .top-row {
		display: flex;
		justify-content: space-between;
    }

	.timestamp {
		text-align: right;
		user-select: none;
        font-size: 0.9em;
	}

	.timestamp-edit {
		font-size: 0.8em;
		color: var(--comment-color-grey-dark);
		user-select: none;
	}

    .profile-info {
        display: flex;
        align-items: center;
    }

    .profile-pic {
        overflow: hidden;
        aspect-ratio: 1;
        width: 32px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
    }

    .username {
        padding-left: 8px;
    }

    .content {
		word-wrap: break-word;
        overflow: hidden;
        margin: 0 8px;
    }

    .content-collapsed {
        max-height: 100px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
    }

    .content-collapsed:after {
        position: absolute;
        bottom: 0;  
        height: 100%;
        width: 100%;
        content: "[Expand]";
        text-align:center;
        display: flex;
        justify-content: center;
        align-items: end;
        padding-bottom: 5px;
        background: linear-gradient(to top,
            var(--comment-color-background) 20%, 
            rgba(255,255,255, 0) 80%
        );
        pointer-events: none; /* so the text is still selectable */
    }

    .button-row {
		display: flex;
		justify-content: space-between;
		color: var(--comment-color-grey-dark);
		user-select: none;
	}
    
	.button-row-inner {
		display: flex;
        flex-wrap: wrap;
	}

    .comment-btn-icon-container {
		margin: 0 2px;
		padding: 5px 10px;
		cursor: pointer;
		width: 10px;
		border-radius: 4px;
		transition-property: background-color, color;
		transition-duration: 0.2s;
	}

	.comment-btn-icon-container:hover {
		background-color: var(--comment-color-grey);
	}

    .comment-btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 1.2em;

		transition-property: color;
		transition-duration: 0.2s;
	}

	.comment-btn-icon-inner {
		display: flex;
		justify-content: center;
		align-items: center;
	}
    
    @keyframes shake {
		0%, 100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-2px);
		}
		50% {
			transform: translateX(2px);
		}
		75% {
			transform: translateX(-2px);
		}
	}
	.delete-confirm{
		animation: shake 0.3s infinite;
		color: rgb(114, 114, 114);
	}
    
	.comment-btn-error {
		background-color: var(--comment-color-red);
	}
	.comment-btn-error:hover {
		background-color: color-mix(in srgb,var(--comment-color-red),#000 10%);
	}
</style>