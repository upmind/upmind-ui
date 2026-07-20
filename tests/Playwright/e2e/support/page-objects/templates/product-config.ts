import { Locator, Page, expect } from "@playwright/test";
import { TextInput } from "../components/text-input";
import { Checkboxes } from "../components/checkboxes";
import { RadioButtons } from "../components/radio-buttons";
import { Button } from "../components/button";
import { Popover } from "../components/popover";
import { Accordion } from "../components/accordion";
import { Select } from "../components/select";
import { Drawer } from "../components/drawer";
import { Form } from "../components/form";
import { Markdown } from "../components/markdown";
import { Lineclamp } from "../components/lineclamp";

export class ProductConfig {
  readonly page: Page;
  readonly textInput: TextInput;
  readonly productConfigSection: Locator;
  readonly configForm: Locator;
  readonly checkboxes: Checkboxes;
  readonly radioButtons: RadioButtons;
  readonly button: Button;
  readonly popover: Popover;
  readonly accordion: Accordion;
  readonly select: Select;
  readonly drawer: Drawer;
  readonly form: Form;
  readonly markdown: Markdown;
  readonly lineclamp: Lineclamp;

  /* Product Options */
  readonly optionsContainer: Locator;
  readonly billingTerms: Locator;
  readonly options: Locator;

  /* Domain Radio Options (new radio-based UI) */
  readonly domainRadioSkip: Locator;
  readonly domainRadioRegister: Locator;
  readonly domainRadioExisting: Locator;
  readonly domainRadioBasket: Locator;
  readonly domainRadioInput: Locator;
  readonly domainExistingInput: Locator;

  /* Domain Accordion Options (legacy - deprecated) */
  readonly domainRegister: Locator;
  readonly domainRegisterInput: Locator;
  readonly domainTransfer: Locator;
  readonly domainExisting: Locator;
  readonly domainBasket: Locator;
  readonly registrantNameInput: Locator;
  readonly registrantOrgInput: Locator;
  readonly registrantEmailInput: Locator;
  readonly registrantPhoneForm: Locator;
  readonly registrantPhoneCountrySelectButton: Locator;
  readonly registrantPhoneCountrySelectInput: Locator;
  readonly registrantPhoneCountrySelectItem: Locator;
  readonly registrantPhoneInput: Locator;
  readonly registrantAddr1Input: Locator;
  readonly registrantCityInput: Locator;
  readonly registrantStateInput: Locator;
  readonly registrantPostcodeInput: Locator;
  readonly registrantCountryInput: Locator;
  readonly promoBadge: Locator;

  /* Order Summary */
  readonly totalValue: Locator;
  readonly totalQty: Locator;
  readonly quantityIncrement: Locator;
  readonly billingCycle: Locator;
  readonly product: Locator;
  readonly development: Locator;
  readonly webHosting: Locator;
  readonly designServices: Locator;
  readonly consulting: Locator;
  readonly bundle: Locator;
  readonly meetingTypes: Locator;
  readonly addons: Locator;
  readonly tracking: Locator;
  readonly tldValue: Locator;
  readonly domainName: Locator;
  readonly domainSetup: Locator;
  readonly domainLocking: Locator;
  readonly registrantName: Locator;
  readonly registrantOrg: Locator;
  readonly registrantEmail: Locator;
  readonly registrantPhone: Locator;
  readonly registrantAddr1: Locator;
  readonly registrantCity: Locator;
  readonly registrantState: Locator;
  readonly registrantPostcode: Locator;
  readonly registrantCountry: Locator;
  readonly addToBasket: Locator;
  readonly confirm: Locator;
  readonly engagementTypes: Locator;
  readonly outcomes: Locator;

  /* Domain Drawer */
  readonly domainDrawer: Locator;
  readonly domainResults: Locator;
  readonly domainItem: Locator;

  /* Meta Slots*/
  readonly summaryMetaSlot: Locator;

  /* Trial Opt-In */
  readonly trialCheckbox: Locator;
  readonly trialBadge: Locator;
  readonly trialDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkboxes = new Checkboxes(page);
    this.radioButtons = new RadioButtons(page);
    this.button = new Button(page);
    this.popover = new Popover(page);
    this.accordion = new Accordion(page);
    this.select = new Select(page);
    this.drawer = new Drawer(page);
    this.form = new Form(page);
    this.markdown = new Markdown(page);
    this.lineclamp = new Lineclamp(page);
    this.optionsContainer = page.getByTestId("content-section").first();

    /* Product Options */
    this.textInput = new TextInput(page);
    this.productConfigSection = page
      .getByTestId("section")
      .and(page.locator(`[data-test-value="product-configuration"]`));
    this.billingTerms = page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="term"]`));
    this.configForm = page.getByTestId("product-config-form");
    this.options = page.getByTestId("options-container-options");

    /* Domain Radio Options (new radio-based UI) */
    // SmartDomainField renders each choice as `<RadioGroupItem :value="...">`
    // keyed off the stable `DomainTypes` enum value (skip|register|existing|
    // basket) — locale-independent, unlike the translated radio label.
    this.domainRadioSkip = page.locator('[role="radio"][value="skip"]');
    this.domainRadioRegister = page.locator('[role="radio"][value="register"]');
    this.domainRadioExisting = page.locator('[role="radio"][value="existing"]');
    this.domainRadioBasket = page.locator('[role="radio"][value="basket"]');
    // The register sub-content's FormControl carries the stable HTML id
    // `domain-register-search`; the existing-domain search has no stable anchor
    // (its FormControl id is a runtime uniqueId), so scope to the sole search
    // input rendered while the "existing" choice is expanded.
    this.domainRadioInput = page.locator("#domain-register-search input");
    this.domainExistingInput = page
      .getByTestId("section")
      .and(page.locator(`[data-test-value="product-configuration"]`))
      .locator('[role="radio"][value="existing"]')
      .locator('xpath=following::input[@type="text"][1]');

    /* Domain Accordion Options (legacy - deprecated) */
    this.domainRegister = page
      .getByTestId("accordion-item")
      .and(page.locator(`[data-test-value="register"]`));
    this.domainRegisterInput = page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="dac-register"]`))
      .locator("input");
    this.domainTransfer = page
      .getByTestId("accordion-item")
      .and(page.locator(`[data-test-value="transfer"]`));
    this.domainExisting = page
      .getByTestId("accordion-item")
      .and(page.locator(`[data-test-value="existing"]`));
    this.domainBasket = page
      .getByTestId("accordion-item")
      .and(page.locator(`[data-test-value="basket"]`));
    this.registrantNameInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-name"]`
        )
      )
      .locator("input");
    this.registrantOrgInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-organisation"]`
        )
      )
      .locator("input");
    this.registrantEmailInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-email"]`
        )
      )
      .locator("input");
    this.registrantPhoneForm = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-phone"]`
        )
      );

    this.registrantPhoneCountrySelectButton =
      this.registrantPhoneForm.getByTestId("button-phone-country");
    this.registrantPhoneCountrySelectInput =
      this.popover.popoverContent.locator("input");
    this.registrantPhoneCountrySelectItem =
      this.popover.popoverContent.getByRole("option");
    this.registrantPhoneInput = this.registrantPhoneForm.locator("input");
    this.registrantAddr1Input = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-address-1"]`
        )
      )
      .locator("input");
    this.registrantCityInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-address-city"]`
        )
      )
      .locator("input");
    this.registrantStateInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-address-state"]`
        )
      )
      .locator("input");
    this.registrantPostcodeInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-address-postcode"]`
        )
      )
      .locator("input");
    this.registrantCountryInput = page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="provision-fields-update-registrant-address-country-code"]`
        )
      )

      .locator("button");
    this.promoBadge = page.getByTestId("badge");

    /* Domain Drawer */ // TODO: Needs to be it's own page object along with the associated functions
    this.domainDrawer = this.drawer.drawerOverlay;
    this.domainResults = this.drawer.domainResults;
    this.domainItem = this.drawer.domainItem;

    /* Order Summary */
    this.totalValue = page.getByTestId("total-price");
    this.totalQty = page.getByTestId("number-field-input"); // TODO: Move to shared page object
    this.quantityIncrement = page.getByTestId("number-field-increment"); // TODO: Move to shared page object
    this.billingCycle = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="billing-cycle"]'))
      .locator("dd");

    // refactor all of this to better fit the dynamic naming of the sumamry fields
    this.product = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="product"]'));
    this.development = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="dev-work"]'));
    this.webHosting = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="shared-hosting"]'));
    this.designServices = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="design-services"]'));
    this.consulting = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="consulting"]'));
    this.bundle = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="bundle"]'));
    this.meetingTypes = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="meeting-types"]'));
    this.addons = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="addons"]'));
    this.tracking = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="tracking"]'));
    this.tldValue = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="domain-names"]'));
    this.domainName = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="account-domain-name"]'))
      .locator("dd");
    this.domainSetup = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="domain-setup-(free)"]'));
    this.domainLocking = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="domain-locking"]'));
    this.registrantName = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-name"]'));
    this.registrantOrg = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-organisation"]'));
    this.registrantEmail = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-email"]'));
    this.registrantPhone = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-phone"]'));
    this.registrantAddr1 = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-address-1"]'));
    this.registrantCity = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-city"]'));
    this.registrantState = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-state"]'));
    this.registrantPostcode = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-postcode"]'));
    this.registrantCountry = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="registrant-country"]'))
      .locator("dd");
    this.engagementTypes = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="engagement-types"]'));
    this.outcomes = page
      .getByTestId("description-list-item")
      .and(page.locator('[data-test-value="outcomes"]'));
    this.addToBasket = page.getByTestId("button-add-to-basket");
    this.confirm = page.getByTestId("button-confirm");

    /* Meta Slots */
    this.summaryMetaSlot = page.getByTestId("slots:summary-append");

    /* Trial Opt-In (CheckboxCards) */
    this.trialCheckbox = page
      .getByTestId("checkbox-item")
      .and(page.locator('[data-test-value="try-before-you-buy"]'));
    this.trialBadge = this.trialCheckbox.getByTestId("badge");
    this.trialDescription = this.trialCheckbox.getByTestId(
      "secondary-item-description"
    );
  }

  /* Product Functions */
  async addProductToBasket(productURL: string) {
    await this.page.goto(productURL);
    await this.addToBasket.click();
  }

  async clickLineclamp() {
    await this.lineclamp.clickLineclamp();
  }

  /**
   * Enter a domain using the new radio-based domain field UI.
   * Clicks the appropriate radio option and fills the domain input.
   *
   * @param option - The domain option: "register" | "existing" | "skip" | "basket"
   * @param domainName - The domain name to enter (required for "register" and "existing")
   */
  async enterDomainRadio(
    option: "register" | "existing" | "skip" | "basket",
    domainName?: string
  ) {
    const radioLocators: Record<string, Locator> = {
      register: this.domainRadioRegister,
      existing: this.domainRadioExisting,
      skip: this.domainRadioSkip,
      basket: this.domainRadioBasket
    };

    const radio = radioLocators[option];
    await radio.click();

    if (option === "register" && domainName) {
      // For register: fill the inline input that appears after selecting the radio
      await this.domainRadioInput.fill(domainName);
    } else if (option === "existing" && domainName) {
      // For existing: fill the SmartDomainExisting input
      await this.domainExistingInput.fill(domainName);
    }
  }

  /**
   * @deprecated Use enterDomainRadio() instead - the accordion-based UI has been replaced with radio buttons.
   */
  async enterDomain(option: string, domainName: string) {
    const radioOption = this.accordion.getAccordion(option);
    await radioOption.click();
    await radioOption
      .getByTestId("accordion-content")
      .locator("input")
      .fill(domainName);
  }

  async enterSld(sld: string) {
    const sldFormField = this.page
      .getByTestId("input")
      .and(
        this.page.locator(
          '[data-test-value="properties-provision-fields-properties-sld"]'
        )
      );
    await sldFormField.fill(sld);
  }

  async addDomain(domain: string) {
    // Wait for the domain check to complete
    try {
      await this.page.waitForResponse(
        response =>
          response.url().includes("modules/web_hosting/domains/search") &&
          response.status() === 200,
        { timeout: 30000 }
      );
    } catch (e) {
      console.log("Domain check response not detected or timed out");
    }
    await this.page
      .getByTestId("drawer-content")
      .getByTestId(`checkbox-item-${domain}`)
      .getByRole("button")
      .dispatchEvent("click");
    await this.page.getByTestId("button-continue").click();
  }

  getFormField(container: Locator) {
    const formField = this.textInput.getTextInputField(container);
    return formField;
  }

  getPromoBadge(radioButton: Locator) {
    const container = radioButton;
    const badge = container.locator(this.promoBadge);
    return badge;
  }

  async promoBadgeDoesNotExist(option: string | number) {
    const term = this.radioButtons.getRadioButton(option);
    await expect(this.getPromoBadge(term)).toBeHidden();
  }

  async promoBadgeExists(option: string | number) {
    const term = this.radioButtons.getRadioButton(option);
    await expect(this.getPromoBadge(term)).toBeVisible();
  }

  async enterRegistrantDetails(
    details: {
      registrantName?: string;
      registrantOrg?: string;
      registrantEmail?: string;
      registrantPhone?: string;
      registrantAddr1?: string;
      registrantCity?: string;
      registrantState?: string;
      registrantPostcode?: string;
      registrantCountryCode?: string;
    },
    // When `ignoreNotVisible` is set, fill a field only if it's actually
    // rendered. The product-setup form shows just the fields still missing for
    // the account (which varies by saved profile — an address-on-file account
    // only needs the phone), so callers there set this to fill whatever is shown
    // and skip the rest instead of timing out on fields the form never renders.
    // Default (false) fills directly with Playwright's auto-wait, as the full
    // registrant form (e.g. domain configuration) expects.
    options: { ignoreNotVisible?: boolean } = {}
  ) {
    const { ignoreNotVisible = false } = options;
    const present = async (locator: Locator) =>
      !ignoreNotVisible || (await locator.isVisible().catch(() => false));

    if (details.registrantName && (await present(this.registrantNameInput))) {
      await this.registrantNameInput.fill(details.registrantName);
    }
    if (details.registrantOrg && (await present(this.registrantOrgInput))) {
      await this.registrantOrgInput.fill(details.registrantOrg);
    }
    if (details.registrantEmail && (await present(this.registrantEmailInput))) {
      await this.registrantEmailInput.fill(details.registrantEmail);
    }
    if (
      details.registrantCountryCode &&
      (await present(this.registrantPhoneInput))
    ) {
      await this.registrantPhoneCountrySelectButton.click();
      // Filtering by the ISO code the test supplied narrows the option list to
      // the matching country; click the first result rather than matching the
      // translated country name.
      await this.registrantPhoneCountrySelectInput.fill(
        details.registrantCountryCode
      );
      await this.registrantPhoneCountrySelectItem.first().click();
    }
    if (details.registrantPhone && (await present(this.registrantPhoneInput))) {
      await this.registrantPhoneInput.fill(details.registrantPhone);
    }
    if (details.registrantAddr1 && (await present(this.registrantAddr1Input))) {
      await this.registrantAddr1Input.fill(details.registrantAddr1);
    }
    if (details.registrantCity && (await present(this.registrantCityInput))) {
      await this.registrantCityInput.fill(details.registrantCity);
    }
    if (details.registrantState && (await present(this.registrantStateInput))) {
      await this.registrantStateInput.fill(details.registrantState);
    }
    if (
      details.registrantPostcode &&
      (await present(this.registrantPostcodeInput))
    ) {
      await this.registrantPostcodeInput.fill(details.registrantPostcode);
    }
    if (
      details.registrantCountryCode &&
      (await present(this.registrantCountryInput))
    ) {
      await this.registrantCountryInput.click();
      await this.page
        .getByTestId("select-item")
        .and(
          this.page.locator(
            `[data-test-value="${details.registrantCountryCode}"]`
          )
        )
        .click();
    }
  }

  async selectRadioOption(option: string) {
    return this.radioButtons.selectRadioOption(option);
  }
  async clickSelectOption(option: string) {
    return this.select.clickSelectOption(option);
  }

  async fillFormInput(label: string, content: string) {
    return this.form.fillFormInput(label, content);
  }

  async clearFormInput(label: string) {
    return this.form.clearFormInput(label);
  }

  /**
   * @param key - Stable summary-item key (the detail's `name`, e.g. `product`,
   *   `shared-hosting`, `term`), NOT a translated category label.
   */
  getSummaryItem(key: string) {
    return this.page
      .getByTestId("description-list-item")
      .and(this.page.locator(`[data-test-value="${key}"]`));
  }

  async clickAddToBasket() {
    await this.addToBasket.click();
  }

  async clickConfirm() {
    await this.confirm.click();
  }

  /* Trial Helper Methods */
  async expectTrialSelected() {
    await expect(this.trialCheckbox).toHaveAttribute("data-state", "on");
  }

  async expectTrialNotSelected() {
    await expect(this.trialCheckbox).toHaveAttribute("data-state", "off");
  }

  async toggleTrial() {
    await this.trialCheckbox.click();
  }

  async isTrialDisabled(): Promise<boolean> {
    const disabled = await this.trialCheckbox.getAttribute("data-disabled");
    return disabled !== null;
  }
}
