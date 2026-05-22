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
import { kebabCase } from "../../helpers/strings";

export class ProductConfig {
  readonly page: Page;
  readonly textInput: TextInput;
  readonly productConfigSection: Locator;
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
  readonly domainButton: Locator;
  readonly domainAddToBasket: Locator;

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
    this.productConfigSection = page.getByTestId(
      "section-product-configuration"
    );
    this.billingTerms = page.getByTestId("form-item-term");
    this.options = page.getByTestId("options-container-options");
    this.domainRegister = page.getByTestId("accordion-item-register");
    this.domainRegisterInput = page
      .getByTestId("form-item-dac-register")
      .locator("input");
    this.domainTransfer = page.getByTestId("accordion-item-transfer");
    this.domainExisting = page.getByTestId("accordion-item-existing");
    this.domainBasket = page.getByTestId("accordion-item-basket");
    this.registrantNameInput = page
      .getByTestId("form-item-provision-fields-update-registrant-name")
      .locator("input");
    this.registrantOrgInput = page
      .getByTestId("form-item-provision-fields-update-registrant-organisation")
      .locator("input");
    this.registrantEmailInput = page
      .getByTestId("form-item-provision-fields-update-registrant-email")
      .locator("input");
    this.registrantPhoneForm = page.getByTestId(
      "form-item-provision-fields-update-registrant-phone"
    );
    this.registrantPhoneCountrySelectButton =
      this.registrantPhoneForm.getByTestId("button-default");
    this.registrantPhoneCountrySelectInput =
      this.popover.popoverContent.locator("input");
    this.registrantPhoneCountrySelectItem =
      this.popover.popoverContent.getByRole("option");
    this.registrantPhoneInput = this.registrantPhoneForm.locator("input");
    this.registrantAddr1Input = page
      .getByTestId("form-item-provision-fields-update-registrant-address-1")
      .locator("input");
    this.registrantCityInput = page
      .getByTestId("form-item-provision-fields-update-registrant-address-city")
      .locator("input");
    this.registrantStateInput = page
      .getByTestId("form-item-provision-fields-update-registrant-address-state")
      .locator("input");
    this.registrantPostcodeInput = page
      .getByTestId(
        "form-item-provision-fields-update-registrant-address-postcode"
      )
      .locator("input");
    this.registrantCountryInput = page
      .getByTestId(
        "form-item-provision-fields-update-registrant-address-country-code"
      )
      .locator("button");
    this.promoBadge = page.getByTestId("badge");

    /* Domain Drawer */ // TODO: Needs to be it's own page object along with the associated functions
    this.domainDrawer = this.drawer.drawerOverlay;
    this.domainResults = this.drawer.domainResults;
    this.domainItem = this.drawer.domainItem;
    this.domainButton = this.drawer.domainButton;
    this.domainAddToBasket = page.getByTestId("button-add-domain-to-basket");

    /* Order Summary */
    this.totalValue = page.getByTestId("total-price");
    this.totalQty = page.getByTestId("quantity-input"); // TODO: Move to shared page object
    this.billingCycle = page
      .getByTestId("description-list-item-billing-cycle")
      .locator("dd");

    // refactor all of this to better fit the dynamic naming of the sumamry fields
    this.product = page.getByTestId("description-list-item-product");
    this.development = page.getByTestId("description-list-item-dev-work");
    this.webHosting = page.getByTestId("description-list-item-shared-hosting");
    this.designServices = page.getByTestId(
      "description-list-item-design-services"
    );
    this.consulting = page.getByTestId("description-list-item-consulting");
    this.bundle = page.getByTestId("description-list-item-bundle");
    this.meetingTypes = page.getByTestId("description-list-item-meeting-types");
    this.addons = page.getByTestId("description-list-item-addons");
    this.tracking = page.getByTestId("description-list-item-tracking");
    this.tldValue = page.getByTestId("description-list-item-domain-names");
    this.domainName = page
      .getByTestId("description-list-item-account-domain-name")
      .locator("dd");
    this.domainSetup = page.getByTestId(
      "description-list-item-domain-setup-(free)"
    );
    this.domainLocking = page.getByTestId(
      "description-list-item-domain-locking"
    );
    this.registrantName = page.getByTestId(
      "description-list-item-registrant-name"
    );
    this.registrantOrg = page.getByTestId(
      "description-list-item-registrant-organisation"
    );
    this.registrantEmail = page.getByTestId(
      "description-list-item-registrant-email"
    );
    this.registrantPhone = page.getByTestId(
      "description-list-item-registrant-phone"
    );
    this.registrantAddr1 = page.getByTestId(
      "description-list-item-registrant-address-1"
    );
    this.registrantCity = page.getByTestId(
      "description-list-item-registrant-city"
    );
    this.registrantState = page.getByTestId(
      "description-list-item-registrant-state"
    );
    this.registrantPostcode = page.getByTestId(
      "description-list-item-registrant-postcode"
    );
    this.registrantCountry = page
      .getByTestId("description-list-item-registrant-country")
      .locator("dd");
    this.engagementTypes = page.getByTestId(
      "description-list-item-engagement-types"
    );
    this.outcomes = page.getByTestId("description-list-item-outcomes");
    this.addToBasket = page.getByTestId("button-add-to-basket");
    this.confirm = page.getByTestId("button-confirm");

    /* Meta Slots */
    this.summaryMetaSlot = page.getByTestId("slots:summary-append");

    /* Trial Opt-In (CheckboxCards) */
    this.trialCheckbox = page.getByTestId("checkbox-item-try-before-you-buy");
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

  async enterDomain(option: string, domainName: string) {
    const radioOption = this.accordion.getAccordion(option);
    await radioOption.click();
    await radioOption
      .getByTestId("accordion-content")
      .locator("input")
      .fill(domainName);
  }

  async enterSld(sld: string) {
    const sldFormField = this.page.getByTestId(
      "input-properties-provision-fields-properties-sld"
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
      .getByTestId(`checkbox-item-${kebabCase(domain)}`)
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

  async promoBadgeDoesNotExist(option: string) {
    const term = this.radioButtons.getRadioButton(option);
    await expect(this.getPromoBadge(term)).toBeHidden();
  }

  async promoBadgeExists(option: string) {
    const term = this.radioButtons.getRadioButton(option);
    await expect(this.getPromoBadge(term)).toBeVisible();
  }

  async enterRegistrantDetails(
    registrantName: string,
    registrantOrg: string,
    registrantEmail: string,
    registrantPhone: string,
    registrantAddr1: string,
    registrantCity: string,
    registrantState: string,
    registrantPostcode: string,
    registrantCountryCode: string
  ) {
    await this.registrantNameInput.fill(registrantName);
    await this.registrantOrgInput.fill(registrantOrg);
    await this.registrantEmailInput.fill(registrantEmail);
    await this.registrantPhoneCountrySelectButton.click();
    await this.registrantPhoneCountrySelectInput.fill(registrantCountryCode);
    await this.registrantPhoneCountrySelectItem
      .getByText("United Kingdom")
      .click();
    await this.registrantPhoneInput.fill(registrantPhone);
    await this.registrantAddr1Input.fill(registrantAddr1);
    await this.registrantCityInput.fill(registrantCity);
    await this.registrantStateInput.fill(registrantState);
    await this.registrantPostcodeInput.fill(registrantPostcode);
    await this.registrantCountryInput.click();
    await this.page.getByTestId(`select-item-${registrantCountryCode}`).click();
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

  getSummaryItem(itemLabel: string) {
    return this.page.getByTestId(
      `description-list-item-${kebabCase(itemLabel)}`
    );
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
