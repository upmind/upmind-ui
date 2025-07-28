import { Locator, Page, expect } from "@playwright/test";
import { URLs } from "../../constants/urls";
import { TextInput } from "../components/TextInput";
import { Checkboxes } from "../components/Checkboxes";
import { RadioButtons } from "../components/RadioButtons";
import { Button } from "../components/Button";
import { Accordion } from "../components/Accordion";
import { Select } from "../components/Select";
import { Drawer } from "../components/Drawer";

export class ProductConfig {
  readonly page: Page;
  readonly textInput: TextInput;
  readonly checkboxes: Checkboxes;
  readonly radioButtons: RadioButtons;
  readonly button: Button;
  readonly accordion: Accordion;
  readonly select: Select;
  readonly drawer: Drawer;

  /* Product Options */
  readonly optionsContainer: Locator;
  readonly checkoutMarkdown: Locator;
  readonly markdownLineclamp: Locator;
  readonly billingTerms: Locator;
  readonly options: Locator;
  readonly domainRegister: Locator;
  readonly domainTransfer: Locator;
  readonly domainExisting: Locator;
  readonly registrantNameInput: Locator;
  readonly registrantOrgInput: Locator;
  readonly registrantEmailInput: Locator;
  readonly registrantPhoneForm: Locator;
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
  readonly confirmAndProceed: Locator;
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

  constructor(page: Page) {
    this.page = page;
    this.checkboxes = new Checkboxes(page);
    this.radioButtons = new RadioButtons(page);
    this.button = new Button(page);
    this.accordion = new Accordion(page);
    this.select = new Select(page);
    this.drawer = new Drawer(page);
    this.optionsContainer = page.getByTestId("content-section").first();
    this.checkoutMarkdown = page.getByTestId("markdown"); //TODO: Find a way to move to shared component page object
    this.markdownLineclamp = page.getByTestId("lineclamp"); //TODO: as above

    /* Product Options */
    this.textInput = new TextInput(page);
    this.billingTerms = page.getByTestId("form-item-terms");
    this.options = page.getByTestId("options-container-options");
    this.domainRegister = page.getByTestId("form-item-dac-register");
    this.domainTransfer = page.getByTestId("form-item-dac-transfer");
    this.domainExisting = page.getByTestId("form-item-dac-existing");
    this.registrantNameInput = page.getByTestId(
      "form-item-update_registrant_name"
    );
    this.registrantOrgInput = page.getByTestId(
      "form-item-update_registrant_organisation"
    );
    this.registrantEmailInput = page.getByTestId(
      "form-item-update_registrant_email"
    );
    this.registrantPhoneForm = page.getByTestId(
      "form-item-update_registrant_phone"
    );
    this.registrantPhoneInput =
      this.registrantPhoneForm.getByTestId("text-input");
    this.registrantAddr1Input = page.getByTestId(
      "form-item-update_registrant_address_1"
    );
    this.registrantCityInput = page.getByTestId(
      "form-item-update_registrant_address_city"
    );
    this.registrantStateInput = page.getByTestId(
      "form-item-update_registrant_address_state"
    );
    this.registrantPostcodeInput = page.getByTestId(
      "form-item-update_registrant_address_postcode"
    );
    this.registrantCountryInput = page.getByTestId(
      "form-item-update_registrant_address_country_code"
    );
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
    this.billingCycle = page.getByTestId("summary-value-billing-cycle");

    // refactor all of this to better fit the dynamic naming of the sumamry fields
    this.product = page.getByTestId("summary-value-product");
    this.development = page.getByTestId("summary-value-dev-work");
    this.webHosting = page.getByTestId("summary-value-shared-hosting");
    this.designServices = page.getByTestId("summary-value-design-services");
    this.consulting = page.getByTestId("summary-value-consulting");
    this.bundle = page.getByTestId("summary-value-bundle");
    this.meetingTypes = page.getByTestId("summary-value-meeting-types");
    this.addons = page.getByTestId("summary-value-addons");
    this.tracking = page.getByTestId("summary-value-tracking");
    this.tldValue = page.getByTestId("summary-value-domain-names");
    this.domainName = page.getByTestId("summary-value-account-domain-name");
    this.domainSetup = page.getByTestId("summary-value-domain-setup-(free)");
    this.domainLocking = page.getByTestId("summary-value-domain-locking");
    this.registrantName = page.getByTestId("summary-value-registrant-name");
    this.registrantOrg = page.getByTestId(
      "summary-value-registrant-organisation"
    );
    this.registrantEmail = page.getByTestId("summary-value-registrant-email");
    this.registrantPhone = page.getByTestId("summary-value-registrant-phone");
    this.registrantAddr1 = page.getByTestId(
      "summary-value-registrant-address-1"
    );
    this.registrantCity = page.getByTestId("summary-value-registrant-city");
    this.registrantState = page.getByTestId("summary-value-registrant-state");
    this.registrantPostcode = page.getByTestId(
      "summary-value-registrant-postcode"
    );
    this.registrantCountry = page.getByTestId(
      "summary-value-registrant-country"
    );
    this.engagementTypes = page.getByTestId("summary-value-engagement-types");
    this.outcomes = page.getByTestId("summary-value-outcomes");
    this.confirmAndProceed = page.getByTestId("button-confirm-and-proceed");

    /* Meta Slots */
    this.summaryMetaSlot = page.getByTestId("slots:summary-append");
  }

  /* Product Functions */
  async addProductToBasket(productURL: string) {
    await this.page.goto(productURL);
    await this.confirmAndProceed.click();
  }

  async clickLineclamp() {
    await this.markdownLineclamp.click();
  }

  async enterDomain(option: number, domainName: string) {
    const radioOption = this.accordion.getAccordion(option);
    await radioOption
      .getByTestId("[data-testid='text-input']")
      .fill(domainName);
  }

  async enterSld(sld: string) {
    const sldFormField = this.page.getByTestId("form-item-sld");
    await sldFormField.fill(sld);
  }

  async addDomain() {
    const drawer = this.drawer.domainResults;
    const card = drawer.getByTestId("dac-card").first();
    const button = card.getByRole("button");
    await button.click();
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

  async promoBadgeDoesNotExist(option: number) {
    const term = this.billingTerms.locator(
      this.radioButtons.radioOption.nth(option)
    );
    await expect(this.getPromoBadge(term)).toBeHidden();
  }

  async promoBadgeExists(option: number) {
    const term = this.billingTerms.locator(
      this.radioButtons.radioOption.nth(option)
    );
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
    await this.registrantPhoneInput.fill(registrantPhone);
    await this.registrantAddr1Input.fill(registrantAddr1);
    await this.registrantCityInput.fill(registrantCity);
    await this.registrantStateInput.fill(registrantState);
    await this.registrantPostcodeInput.fill(registrantPostcode);
    await this.optionsContainer
      .locator(this.page.getByRole("combobox"))
      .click();
    await this.page.getByTestId(`select-item-${registrantCountryCode}`).click();
  }

  async clickBillingTerm(option: number) {
    const term = this.billingTerms.locator(
      this.radioButtons.radioOption.nth(option)
    );
    await term.click();
  }
}
