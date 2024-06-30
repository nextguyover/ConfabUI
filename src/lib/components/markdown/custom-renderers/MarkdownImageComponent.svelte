<script>
    import Fa from "svelte-fa/src/fa.svelte";
    import { faImage } from "@fortawesome/free-solid-svg-icons";
    import Tooltip from "../../misc/tooltip.svelte";

    export let href = "";
    export let title = undefined;
    export let text = "";

    export let confirmImageUrl;

    let awaitingConfirmation = true;
    let imgDomain;
    let imgDomainSubdomains;
    let imgDomainTopLvl;
    let domainTrust = null;

    if(confirmImageUrl !== true){
        awaitingConfirmation = false;
    }

    let trustedImageHostingDomains = [
        "imgur.com",
        "unsplash.com",
        "flickr.com",
        "postimages.org",
        "imgbb.com",
        "cubeupload.com",
        "lensdump.com",
        "imgchest.com",
    ]

    if(awaitingConfirmation){
        try{
            imgDomain = new URL(href).hostname;
            imgDomainTopLvl = imgDomain.split('.').reverse().splice(0,2).reverse().join('.')
            imgDomainSubdomains = imgDomain.substring(0, imgDomain.indexOf(imgDomainTopLvl))
        } catch{}

        if(trustedImageHostingDomains.find(item => item === imgDomainTopLvl)){
            domainTrust = true;
        }
    }
</script>

<div class="img-container-outer">
    <div class="img-container" class:img-confirmation-container={awaitingConfirmation}>
        {#if !awaitingConfirmation}
            <img src={href} {title} alt={text} />
        {:else}
            <div class="img-confirmation">
                <div class="img-confirmation-text">
                    This is an image linked from the following domain
                </div>
                <div class="img-confirmation-domain-container">
                    <div class="img-confirmation-domain-icon"><Fa icon={faImage}/></div>
                    <div class="img-confirmation-domain">
                        {imgDomainSubdomains}<span class:img-confirmation-domain-trusted={domainTrust === true} class="img-confirmation-domain-root">{imgDomainTopLvl}</span>
                    </div>
                    <div class="img-confirmation-domain-trust" >
                        {#if domainTrust === true}
                            This domain is trusted (service may allow NSFW content)
                        {:else}
                            Domain was not found in the trusted domains list. Proceed with caution.
                        {/if}
                    </div>
                </div>
                <div class="img-confirmation-btn" role="button" tabindex="0" on:click={() => awaitingConfirmation = false} on:keypress={() => awaitingConfirmation = false}>Show Image</div>
                <div class="img-confirmation-text-full-url">
                    {href}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    img, .img-confirmation {
        object-fit: contain;
        max-height: 500px;
        width: 100%;
        border-radius: 4px;
    }

    .img-container{
        border-radius: 4px;
        overflow: hidden;
    }

    .img-confirmation-container{
        width: min(100%, 400px);
    }

    .img-container-outer{
        display: flex;
        justify-content: center;
        flex-direction: row;
    }

    .img-confirmation{
        width: unset;
        max-height: unset;
        background-color: rgb(230, 230, 230);
        padding: 10px;
        display: flex;
        align-items: center;
        flex-direction: column;
        text-align: center;
        color: rgb(54, 54, 54);
        border: 1px solid rgb(168, 168, 168);
        word-break: break-word;
    }

    .img-confirmation-text-full-url{
        font-size: 0.7em;
        opacity: 0.7;
        word-break: break-all;
    }

    .img-confirmation-domain{
        color: rgb(109, 109, 109);
        font-size: 1.1em;
        font-weight: bold;
    }
    .img-confirmation-domain-root{
        color: rgb(31, 31, 31);
    }
    .img-confirmation-domain-trusted{
        color: rgb(11, 116, 11);
    }

    .img-confirmation-domain-icon{
        margin: 10px 0 10px 0;
        font-size: 1.4em;
    }

    .img-confirmation-domain-trust{
        font-size: 0.8em;
    }

    .img-confirmation-btn{
        margin: 20px 0;
        padding: 5px;
        border-radius: 4px;
        width: fit-content;
        background-color: #00000009;
        transition: background-color 0.1s;
        border: 1px solid rgb(168, 168, 168);
        cursor: pointer;
    }
    
    .img-confirmation-btn:hover{
        background-color: #00000018;
    }
    
</style>