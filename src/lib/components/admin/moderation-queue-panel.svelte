<script>
    import Fa from "svelte-fa/src/fa.svelte";
	import { faChevronUp, faCircleNotch } from "@fortawesome/free-solid-svg-icons";

    const PUBLIC_API_URL = getContext("PUBLIC_API_URL");
	import { getContext, onMount } from "svelte";

    import ModerationQueueComment from "./moderation-queue-comment.svelte";

    export let rootActions;

    let panelCollapsed = true;
    
	let permaDeleteAllModQueueUserId;

    const permaDeleteAllModQueueSetUserId = (userId) => {
        permaDeleteAllModQueueUserId = userId;
    }

    let queueData = [];

    let dataPending = false;
    let dataFetchError = false;

    const togglePanelCollapse = () => {
        panelCollapsed = !panelCollapsed;

        if(!panelCollapsed){
			dataPending = true;
			refreshData();
		}
    }

    const refreshData = async () => {
        let response;
        try{
            dataFetchError = true;
            response = await fetch(PUBLIC_API_URL + "/admin/comment/moderation-queue", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                },
            });

            if(response.ok) {
                queueData = await response.json();
                dataFetchError = false;
                permaDeleteAllModQueueSetUserId(null);
            }
        }
        catch{} finally {
            dataPending = false;
        }
    };

    onMount(async () => {
        await refreshData();

        refreshModQueueNotificationMarker();
    });

    $: refreshModQueueNotificationMarker(panelCollapsed)

    let notificationActive = false;
    const refreshModQueueNotificationMarker = (discard = null) => {
        notificationActive = queueData.length > 0;
    }
</script>

<section class="panel-container">
    <div class="panel">
        <div class="panel-title">
            <div class="panel-title-text">
                {#if notificationActive && panelCollapsed}
                    <span class="notification-marker"></span>
                {/if}
                Moderation Queue</div>
            <div class="panel-collapse-btn" class:panel-collapse-btn-flipped={panelCollapsed} role="button" tabindex="0" on:click={togglePanelCollapse} on:keypress={togglePanelCollapse}>
            <Fa icon={faChevronUp}/></div>
        </div>

        {#if !panelCollapsed}
            {#if dataPending}
                <div class="data-pending-spinner">
                    <Fa icon={faCircleNotch} spin />
                </div>
            {:else}
                {#if queueData.length > 0}
                    {#each queueData as queueLocation (queueLocation.location)}
                        <div class="location-panel-container">
                            <div class="location-panel">
                                <span class="location-str">{queueLocation.location}</span>

                                {#each queueLocation.comments as queueComment (queueComment.id)}
                                    <div class="comment-section">
                                        {#if queueComment.parentId}
                                            <div class="comment comment-parent">
                                                <ModerationQueueComment {rootActions} 
                                                    id={queueComment.parentId} 
                                                    creationTime={queueComment.parentCreationTime} 
                                                    content={queueComment.parentContent}
                                                    authorId={queueComment.parentAuthorId}
                                                    authorUsername={queueComment.parentAuthorUsername}
                                                    isParent={true}
                                                    location={queueLocation.location}
                                                />
                                            </div>
                                        {/if}
                                        <div class="comment" class:comment-child={queueComment.parentId}>
                                            <ModerationQueueComment {rootActions} 
                                                id={queueComment.id} 
                                                creationTime={queueComment.creationTime} 
                                                content={queueComment.content}
                                                editTime={queueComment.editTime}
                                                authorId={queueComment.authorId}
                                                authorUsername={queueComment.authorUsername}
                                                location={queueLocation.location}
                                                refreshQueueAction={refreshData}
                                                permaDeleteAllModQueueSetUserId={permaDeleteAllModQueueSetUserId}
                                                deletedAuthorId={permaDeleteAllModQueueUserId}
                                            />
                                        </div>
                                    </div>
                                    
                                {/each}
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div style="padding-top: 15px; text-align: center;">There are no comments awaiting moderation.</div>
                {/if}
            {/if}
        {/if}
    </div>
</section>

<style>
    .panel-container {
		background-color: var(--background-color);
		outline: 1px solid var(--outline-color-grey);
		border-radius: 4px;
    }

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 10px 20px 10px;
	}

    .panel-title {
		font-family: "Questrial", sans-serif;
		text-align: center;
		font-size: 2em;
        display: flex;
        align-items: center;
    }

    @media (max-width: 370px) {
       .panel-title {
            max-width: 200px;
        }
    }

    .panel-title-text {
        width: 100%;
        display: flex;
        align-items: center;
    }

    @keyframes notification-anim {
		0%, 100% {
			transform: scale(80%);
		}
		50% {
			transform: scale(120%);
		}
	}

    .notification-marker{
        position: absolute;
        display:inline-block;
        margin-inline-start: -24px;
        aspect-ratio: 1;
        height: 14px;
        border-radius: 7px;
        background-color: blue;
		animation: notification-anim 2s infinite ;
    }

    .panel-collapse-btn {
        font-size: 0.6em;
        display: inline-block;
        margin-left: 10px;
        color: var(--comment-color-grey-dark);
        transition: transform 0.3s ease;
        user-select: none;
        cursor: pointer;
    }

    .panel-collapse-btn-flipped {
		transform: rotate(180deg);
    }

    .data-pending-spinner {
        font-size: 2em;
        color: var(--comment-color-grey-dark);
        padding-top: 10px;
    }

    .location-panel-container {
        outline: solid 1px var(--outline-color-grey-dark);
        border-radius: 4px;
        width: 100%;
        margin: 10px;
    }

    .location-panel {
        margin: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .location-str {
        text-align: center;
        color: rgb(81, 170, 139);
    }

    .comment-child {
        margin-left: 10px;
        border-left: solid 1px grey;
    }

    .comment-section {
        padding: 10px 0 0px 0;
    }
</style>