import { Locator, Page } from "@playwright/test";
import { URLs } from "../../constants/urls";
import { TextInput } from "../components/TextInput";
import { Checkboxes } from "../components/Checkboxes";
import { RadioButtons } from "../components/RadioButtons";
import { Button } from "../components/Button";
import { Accordion } from "../components/Accordion";
import { Select } from "../components/Select";

export class Checkout {
  readonly page: Page;
  readonly textInput: TextInput;
  readonly checkboxes: Checkboxes;
  readonly radioButtons: RadioButtons;
  readonly button: Button;
  readonly accordion: Accordion;
  readonly select: Select;

  /* Product Options */
  readonly optionsContainer: Locator;
  readonly checkoutMarkdown: Locator;
  readonly markdownLineclamp: Locator;
  readonly options: Locator;
  readonly domainInput: Locator;
  readonly registrantNameInput: Locator;
  readonly registrantOrgInput: Locator;
  readonly registrantEmailInput: Locator;
  readonly registrantPhoneInput: Locator;
  readonly registrantAddr1Input: Locator;
  readonly registrantCityInput: Locator;
  readonly registrantStateInput: Locator;
  readonly registrantPostcodeInput: Locator;
  readonly registrantCountryInput: Locator;

  /* Domain Drawer */
  readonly drawer: Locator;
  readonly drawerFooter: Locator;
  readonly addDomainToBasket: Locator;

  /* Order Summary */
  readonly totalValue: Locator;
  readonly totalQty: Locator;
  readonly billingCycle: Locator;
  readonly product: Locator;
  readonly development: Locator;
  readonly bundle: Locator;
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

  constructor(page: Page) {
    this.page = page;
    this.checkboxes = new Checkboxes(page);
    this.radioButtons = new RadioButtons(page);
    this.accordion = new Accordion(page);
    this.select = new Select(page);
    this.optionsContainer = page.getByTestId("card-container");
    this.checkoutMarkdown = page.getByTestId("markdown"); //TODO: Find a way to move to shared component page object
    this.markdownLineclamp = page.getByTestId("lineclamp"); //TODO: as above

    /* Product Options */
    this.textInput = new TextInput(page);
    this.options = page.getByTestId("options-container-options");
    this.domainInput = page.getByTestId("text-input");
    this.registrantNameInput = this.getFormField(
      page.getByTestId("form-field-registrant-name")
    );
    this.registrantOrgInput = this.getFormField(
      page.getByTestId("form-field-registrant-organisation")
    );
    this.registrantEmailInput = this.getFormField(
      page.getByTestId("form-field-registrant-email")
    );
    this.registrantPhoneInput = this.getFormField(
      page.getByTestId("form-field-registrant-phone")
    );
    this.registrantAddr1Input = this.getFormField(
      page.getByTestId("form-field-registrant-address-1")
    );
    this.registrantCityInput = this.getFormField(
      page.getByTestId("form-field-registrant-city")
    );
    this.registrantStateInput = this.getFormField(
      page.getByTestId("form-field-registrant-state")
    );
    this.registrantPostcodeInput = this.getFormField(
      page.getByTestId("form-field-registrant-postcode")
    );
    this.registrantCountryInput = page.getByTestId(
      "form-field-registrant-country"
    );
    //this.registrantCountryOption = this.getDropdownOption(this.registrantCountryInput)

    /* Domain Drawer */ // TODO: Needs to be it's own page object along with the associated functions
    this.drawer = page.getByTestId("drawer-overlay");
    this.drawerFooter = page.getByTestId("drawer-footer");
    this.button = new Button(page);
    this.addDomainToBasket = page.getByTestId("button-add-domain-to-basket");

    /* Order Summary */
    this.totalValue = page.getByTestId("total-price");
    this.totalQty = page.getByTestId("quantity-input"); // TODO: Move to shared page object
    this.billingCycle = page.getByTestId("summary-value-billing-cycle");

    // refactor all of this to better fit the dynamic naming of the sumamry fields
    this.product = page.getByTestId("summary-value-product");
    this.development = page.getByTestId("summary-value-development");
    this.bundle = page.getByTestId("summary-value-bundle");
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
  }

  /* Checkout Functions */
  async checkoutWithProduct(productId: string) {
    await this.page.goto(`${URLs.baseUrl}product/add/${productId}`);
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
    const sldInputExtended = this.page.getByTestId("input-extended");
    const sldInput = sldInputExtended.getByTestId("text-input");
    await sldInput.fill(sld);
  }

  getAddButton(checkboxNumber: number) {
    const getDomainItem = this.checkboxes.checkboxOption.nth(checkboxNumber);
    const getButton = getDomainItem.locator(this.button.button);
    return getButton;
  }

  async clickAddButton(checkboxNumber: number) {
    const button = this.getAddButton(checkboxNumber);
    await button.click();
  }

  getFormField(container: Locator) {
    const formField = this.textInput.getTextInputField(container);
    return formField;
  }
}
