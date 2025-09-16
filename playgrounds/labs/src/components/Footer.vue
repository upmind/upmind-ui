<template>
  <div class="w-full">
    <footer class="footerTheme" aria-labelledby="footer-heading">
      <div class="bg-base-background text-base-foreground">
        <div class="max-w-app container mx-auto py-16">
          <h2 id="footer-heading" class="sr-only">Footer</h2>
          <div
            class="flex flex-col items-start justify-between space-y-8 sm:flex-row sm:space-y-0"
          >
            <div class="max-w-md space-y-8">
              <a href="/" target="_self"
                ><span class="sr-only">Webcentral</span
                ><picture
                  ><!----><!----><img
                    class="w-logoWidthFooter h-logoHeightFooter"
                    src="@/assets/logo.svg"
                    width="185"
                    height="40"
                    alt=""
                    loading="lazy" /></picture
              ></a>
              <div class="text-xsFooter text-footerContent font-body">
                <p>
                  Australia’s largest and most experienced domain name
                  registrar, with accreditation for Australian and international
                  names.
                </p>
              </div>
              <!---->
            </div>

            <div>
              <UpmCurrency class="font-normal" />
            </div>
          </div>
          <div
            class="mt-12 block items-center justify-between space-y-10 border-t pt-12 text-center md:flex md:space-y-0 md:text-left"
          >
            <div class="flex items-center justify-center md:justify-normal">
              <div class="flex space-x-4">
                <!--[--><!--[--><a
                  href="https://www.facebook.com/webcentralau/"
                  target="_blank"
                  class="text-footerSocial hover:text-footerSocialHover"
                  ><span class="sr-only">Facebook</span
                  ><svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    class="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
                      clip-rule="evenodd"
                    ></path></svg></a
                ><a
                  href="https://twitter.com/WebCentralAU"
                  target="_blank"
                  class="text-footerSocial hover:text-footerSocialHover"
                  ><span class="sr-only">X</span
                  ><svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    class="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.795 10.533 20.68 2h-3.073l-5.255 6.517L7.69 2H1l7.806 10.91L1.47 22h3.074l5.705-7.07L15.31 22H22l-8.205-11.467Zm-2.38 2.95L9.97 11.464 4.36 3.627h2.31l4.528 6.317 1.443 2.02 6.018 8.409h-2.31l-4.934-6.89Z"
                    ></path></svg></a
                ><!--]--><!--]-->

                <div class="text-base-foreground">
                  Powered by
                  <a
                    href="https://upmind.com"
                    target="_blank"
                    class="inline-block underline"
                    >Upmind</a
                  >
                </div>
              </div>
              <!---->
            </div>

            <p class="text-xsFooter text-footerContent mt-6 md:mt-0">
              © 2025 Webcentral. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
    <!---->
    <div
      style="display: none"
      id="bottom-left-modal"
      data-modal-placement="bottom-left"
      tabindex="1"
      class="gdprTheme h-modal fixed inset-x-0 right-0 bottom-0 left-0 z-2147483002 items-end overflow-y-auto p-4 md:right-auto"
    >
      <div class="relative h-full max-w-lg md:h-auto">
        <div
          class="bg-gdprBackground dark:bg-gdprBackgroundDark border-gdprBorder dark:border-gdprBorderDark rounded-dropdownNavigation relative border"
        >
          <div class="space-y-4 p-6">
            <h3 class="text-heading dark:text-headingDark text-base-foreground">
              We use cookies
            </h3>
            <div
              class="prose-strong:text-content prose-headings:text-heading dark:prose-headings:text-headingDark prose-p:text-content dark:prose-p:text-contentDark prose-p:text-xxs prose-a:text-link prose-a:hover:text-linkHover marker:text-content prose prose-headings:font-display prose-p:font-body prose-a:cursor-pointer prose-a:underline md:prose-p:text-xs"
            >
              <p>
                Our website uses cookies for essential functions, analytics, and
                advertising. By clicking 'Accept', you consent to our
                <a href="/terms-of-service">cookie policy</a> and data use.
              </p>
            </div>
            <!---->
          </div>
          <div class="flex items-center justify-between px-6 pb-6">
            <button
              class="text-link hover:text-linkHover dark:text-linkDark dark:hover:text-linkDarkHover text-cta"
              tabindex="1"
            >
              Preferences</button
            ><button
              type="button"
              class="text-cta hover:text-ctaHover dark:text-ctaDark dark:hover:text-ctaDarkHover bg-ctaBackground hover:bg-ctaBackgroundHover dark:bg-ctaBackgroundDark dark:hover:bg-ctaBackgroundHoverDark inline-block rounded-sm px-4 py-1.5"
              tabindex="2"
            >
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- internal
import { UpmCurrency } from "@upmind-automation/client-vue";
</script>
