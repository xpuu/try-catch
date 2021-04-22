<div class="h-100p flex flex-col">
  <div class="flex-grow flex items-center justify-center">
    <div>
      {#if error}
        Error
      {:else if !transfer}
        Nothing to do
      {:else}
        Transfer in progress
      {/if}
    </div>
    <div />
  </div>
  <footer class="flex items-center justify-center">
    <button on:click={fileTransfer}>Transfer my file</button>
  </footer>
</div>

<script>
  import wretch from 'wretch'

  let transfer = false
  let error = false

  async function fileTransfer() {
    try {
      await wretch('api').post().res()
      transfer = true
      let checkTransfer = async () => {
        let res = await wretch('api').get().text()
        if (res === 'progress') setTimeout(checkTransfer, 1000)
        else throw res
      }
      await checkTransfer()
    } catch (err) {
      console.error(err)
      error = true
    }
  }
</script>

<style type="text/scss">
  footer {
    height: 100px;
    border-top: 1px solid #ccc;
  }
  button {
    padding: 16px 24px;
    font-size: 16px;
  }
</style>
