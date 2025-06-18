/**
 * @file Contains functions for interacting with the Helioviewer Event Tree and Markers
 */

import { Page, Locator, expect } from "@playwright/test";

class EventTree {
  page: Page;
  root: Locator;
  markersRoot: Locator;
  source: string;

  constructor(source, page) {
    this.page = page;
    this.root = page.locator("#event-tree-container-" + source);
    this.markersRoot = page.locator("#tree_" + source + "-event-container");
    this.source = source;
  }

  /**
   * This function checks if the given event_type exists in the given event tree and returns a boolean promise whether tree has this event_type or not.
   * @param event_type The event type to be checked (e.g. "Active Region", "Corona Hole").
   * @return A promise that resolves to a boolean value indicating whether the event type exists in the event tree (true) or not (false).
   */
  async hasEventType(event_type: string): Promise<boolean> {
    const eventTypeCount = await this.page
      .getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type}`)
      .count();
    return eventTypeCount == 1;
  }

  /**
   * This function checks if the given frm is present in the event tree under the given event_type.
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @return promise to resolve true or false
   **/
  async hasFRM(event_type: string, frm: string): Promise<boolean> {
    const eventFRMNodeCount = await this.page
      .getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm}`)
      .count();
    return eventFRMNodeCount == 1;
  }

  /**
   * This function counts the number of event instances under given frm in the event tree under the given event_type.
   * ATTENTION: this function does not care if the event_instance nodes under frm are visible or not,
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @return promise to resolve the number of event instances under frm
   **/
  async frmEventCount(event_type: string, frm: string): Promise<number> {
    return await this.page
      .locator(`[data-testid^="event-tree-checkbox-${this.source}>>${event_type}>>${frm}>>"]`)
      .count();
  }

  /**
   * This function checks if the given event_instance is present in the event tree under the given frm under the given event_type.
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return promise to resolve true or false
   **/
  async frmHasEventInstance(event_type: string, frm: string, event_instance: string): Promise<boolean> {
    const eventInstanceCount = await this.page
      .getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`)
      .count();
    return eventInstanceCount == 1;
  }

  /**
   * This function toggles ( checks if unchecked or unchecks if checked ) the given event_type in event_tree
   * All the events under this event type should be shown/hidden after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @return void promise about the task is done
   **/
  async toggleCheckEventType(event_type: string) {
    await this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type}`).click();
  }

  /**
   * This function toggles ( checks if unchecked or unchecks if checked ) the given frm under the given event_type in event_tree
   * All the events markers under this frm should be shown/hidden after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @return void promise about the task is done
   **/
  async toggleCheckFRM(event_type: string, frm: string) {
    await this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm}`).click();
  }

  /**
   * This function toggles ( checks if unchecked or unchecks if checked ) the given event_instance under the given frm under the given event_type in event_tree
   * The event marker matching this event_instance should be shown/hidden after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the task is done
   **/
  async toggleCheckEventInstance(event_type: string, frm: string, event_instance: string) {
    await this.page
      .getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`)
      .click();
  }

  /**
   * This function toggles ( opens if closed or closes if opened ) the given frm brach under the given event_type in event_tree
   * This operation presses the little caret near the FRM node in event tree, and make all event_instances nodes under the frm visible/unvisible to the user
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @return void promise about the task is done
   **/
  async toggleBranchFRM(event_type: string, frm: string) {
    await this.page.getByTestId(`event-tree-expand-triangle-${this.source + ">>" + event_type + ">>" + frm}`).click();
  }

  /**
   * This function asserts if the given event_instance node is visible under the frm in given event_tree
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventInstanceTreeNodeVisible(event_type: string, frm: string, event_instance: string) {
    await expect(
      this.page.getByTestId(
        `event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`
      )
    ).toBeVisible();
  }

  /**
   * This function asserts if the given event_instance node is NOT visible under the frm in given event_tree
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventInstanceTreeNodeNotVisible(event_type: string, frm: string, event_instance: string) {
    await expect(
      this.page.getByTestId(
        `event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`
      )
    ).not.toBeVisible();
  }

  /**
   * This function hovers the mouse to the given event_type node in event_tree
   * All the event markers under this event type should be highlighted after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @return void promise about the task is done
   **/
  async hoverOnEventType(event_type: string) {
    await this.page.getByTestId(`event-tree-label-${this.source}>>${event_type}`).hover();
  }

  /**
   * This function hovers the mouse to the given frm node under the given event_type node in event_tree
   * All the event markers under this frm should be highlighted after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @return void promise about the task is done
   **/
  async hoverOnFRM(event_type: string, frm: string) {
    await this.page.getByTestId(`event-tree-label-${this.source}>>${event_type}>>${frm}`).hover();
  }

  /**
   * This function hovers the mouse to the given frm node under the given event_type node in event_tree
   * All the event markers under this frm should be highlighted after this operation
   * @param event_type parameter specifies the type of event (ex: Active Region, Corona Hole)
   * @param frm parameter specifies the name of the frm (ex: "NOAA SWPC Observer").
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async hoverOnEventInstance(event_type: string, frm: string, event_instance: string) {
    await this.page.getByTestId(`event-tree-label-${this.source}>>${event_type}>>${frm}>>${event_instance}`).hover();
  }

  /**
   * This function asserts if the event for given event_instance is visible
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventVisible(event_instance: string) {
    await expect(this.page.getByTestId(`event-marker-${event_instance}`)).toBeVisible();
  }

  /**
   * This function asserts if the event for given event_instance is NOT visible
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventNotVisible(event_instance: string) {
    await expect(this.page.getByTestId(`event-marker-${event_instance}`)).not.toBeVisible();
  }

  /**
   * This function asserts if the event for given event_instance is visible
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventLabelVisible(event_instance: string) {
    await expect(this.page.getByTestId(`event-label-${event_instance}`)).toBeVisible();
  }

  /**
   * This function asserts if the event for given event_instance is NOT visible
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventLabelNotVisible(event_instance: string) {
    await expect(this.page.getByTestId(`event-label-${event_instance}`)).not.toBeVisible();
  }

  /**
   * This function asserts if the event for given event_instance is visible and it is highlighted
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventHighlighted(event_instance: string) {
    const markerLabel = await this.page.getByTestId(`event-label-${event_instance}`);
    await expect(markerLabel).toBeVisible();
    await expect(markerLabel).toHaveClass("event-label event-label-hover");
  }

  /**
   * This function asserts if the marker for given event_instance is visible but it is NOT highlighted
   * @param event_instance parameter specifies the name of the event instance (ex: "NOAA 12674 β").
   * @return void promise about the assertion is done
   **/
  async assertEventNotHighlighted(event_instance: string) {
    const markerLabel = await this.page.getByTestId(`event-label-${event_instance}`);
    await expect(markerLabel).toBeVisible();
    await expect(markerLabel).not.toHaveClass("event-label event-label-hover");
  }

  /**
   * This function toggles "hiding of empty event sources" functionality for this event source layer
   * @return {Promise<void>} you can await this promise to wait for toggling to complete
   **/
  async toggleVisibilityEmptyEventSources(): Promise<void> {
    await this.page.getByTestId(`event-tree-empty-resource-visibility-button-${this.source}`).click();
  }

  /**
   * This function toggles "hiding/showing of events" for this event source layer
   * @return {Promise<void>} you can await this promise to wait for toggling to complete
   **/
  async toggleVisibilityEvents(): Promise<void> {
    await this.page.getByTestId(`event-tree-event-visibility-button-${this.source}`).click();
  }

  /**
   * This function toggles "hiding/showing of event labels not the pins" for this event source layer
   * @return {Promise<void>} you can await this promise to wait for toggling to complete
   **/
  async toggleVisibilityEventLabels(): Promise<void> {
    await this.page.getByTestId(`event-tree-event-label-visibility-button-${this.source}`).click();
  }

  /**
   * This function triggers "check all" functionality for this event source layer
   * "Check all" function turns on all events for this source,
   * it checks all possible event_type and frm and events_instances'es checkboxes.
   * @return {Promise<void>} you can await this promise to wait for this function to complete
   **/
  async checkAll(): Promise<void> {
    await this.page.getByTestId(`event-tree-checkbox-${this.source}`).click();
  }

  /**
   * This function triggers "check none" functionality for this event source layer
   * "Check none" function turns off all events for this source,
   * it unchecks all possible event_type and frm and events_instances'es checkboxes.
   * @return {Promise<void>} you can await this promise to wait for this function to complete
   **/
  async checkNone(): Promise<void> {
    const isChecked = await this.page.getByTestId(`event-tree-checkbox-${this.source}`).isChecked();
    const isIndeterminate = await this.page
      .getByTestId(`event-tree-checkbox-${this.source}`)
      .evaluate((el: HTMLInputElement) => el.indeterminate);

    if (isIndeterminate) {
      // if half checked , first click makes it checked, then second click makes it unchecked
      await this.page.getByTestId(`event-tree-checkbox-${this.source}`).click();
      await this.page.getByTestId(`event-tree-checkbox-${this.source}`).click();
    } else if (isChecked) {
      // if checked , first click makes it unchecked
      await this.page.getByTestId(`event-tree-checkbox-${this.source}`).click();
    }
  }

  /**
   * This function checks if the given event_type node is checked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventTypeNodeChecked(event_type: string): Promise<void> {
    await expect(this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type}`)).toBeChecked();
  }

  /**
   * This function checks if the given frm node is checked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @param {string} frm, The frm name pointing to the node in tree (e.g. "NOAA SWPC Observer", "SPoCA").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertFrmNodeChecked(event_type: string, frm: string): Promise<void> {
    await expect(
      this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm}`)
    ).toBeChecked();
  }

  /**
   * This function checks if the given event instance node is checked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @param {string} frm, The frm name pointing to the node in tree (e.g. "NOAA SWPC Observer", "SPoCA").
   * @param {string} event_instance, The event instance name pointing to the node in tree (e.g. "SPoCA 37775", "NOAA 13814").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventInstanceNodeChecked(event_type: string, frm: string, event_instance: string): Promise<void> {
    await expect(
      this.page.getByTestId(
        `event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`
      )
    ).toBeChecked();
  }

  /**
   * This function checks if the given event_type node is unchecked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventTypeNodeUnchecked(event_type: string): Promise<void> {
    await expect(this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type}`)).not.toBeChecked();
  }

  /**
   * This function checks if the given event_type node is halfchecked (not all of its childrens are selected) in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventTypeNodeHalfChecked(event_type: string): Promise<void> {
    await expect(this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type}`)).toHaveJSProperty(
      "indeterminate",
      true
    );
  }

  /**
   * This function checks if the given frm node is unchecked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @param {string} frm, The frm name pointing to the node in tree (e.g. "NOAA SWPC Observer", "SPoCA").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertFrmNodeUnchecked(event_type: string, frm: string): Promise<void> {
    await expect(
      this.page.getByTestId(`event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm}`)
    ).not.toBeChecked();
  }

  /**
   * This function checks if the given frm node is halfchecked (not all of its childrens are selected) in event tree.
   * @param {string} frm, The frm name pointing to the node in tree (e.g. "NOAA SWPC Observer", "SPoCA").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertFrmNodeHalfChecked(event_type: string, frm: string): Promise<void> {
    const eventTypeLink = this.page.getByRole("link", { name: EventTree.makeNumericRegex(event_type) });
    const eventTypeNode = await this.root.getByRole("listitem").filter({ has: eventTypeLink });

    const eventFRMLink = this.page.getByRole("link", { name: EventTree.makeNumericRegex(frm) });
    const eventFRMNode = await eventTypeNode.getByRole("listitem").filter({ has: eventFRMLink });

    await expect(eventFRMNode).toHaveClass(/jstree-undetermined/);
  }

  /**
   * This function checks if the given event instance node is unchecked in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @param {string} frm, The frm name pointing to the node in tree (e.g. "NOAA SWPC Observer", "SPoCA").
   * @param {string} event_instance, The event instance name pointing to the node in tree (e.g. "SPoCA 37775", "NOAA 13814").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventInstanceNodeUnchecked(event_type: string, frm: string, event_instance: string): Promise<void> {
    await expect(
      this.page.getByTestId(
        `event-tree-checkbox-${this.source + ">>" + event_type + ">>" + frm + ">>" + event_instance}`
      )
    ).not.toBeChecked();
  }

  /**
   * This function checks if the given event_type node is visible in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventTypeNodeVisible(event_type: string): Promise<void> {
    await expect(this.page.getByTestId(`event-tree-checkbox-${this.source}>>${event_type}`)).toBeVisible();
  }

  /**
   * This function checks if the given event_type node is not visible in event tree.
   * @param {string} event_type, The event type name pointing to the node in tree (e.g. "Active Region", "Corona Hole").
   * @return {Promise<void>} A promise for you to wait for assertion to complete.
   */
  async assertEventTypeNodeNotVisible(event_type: string): Promise<void> {
    await expect(this.page.getByTestId(`event-tree-checkbox-${this.source}>>${event_type}`)).not.toBeVisible();
  }

  /**
   * Creates a dynamic regular expression to match a pattern like "text (number)".
   * If no text is provided, it matches any text before the number.
   *
   * @static
   * @param {string} [treeVariable=""] - The specific frm or eventtype name to vturn into \frm (5)\.
   * @returns {RegExp} The dynamically created regular expression to match the given string + numbers.
   */
  static makeNumericRegex(treeVariable: string = ""): RegExp {
    // Escape special characters in the treeVariable if necessary
    const escapedTreeVariable = treeVariable ? treeVariable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : ".*";

    // Return a dynamically created regex
    return new RegExp(`^(${escapedTreeVariable})( \\(\\d+\\))?$`);
  }
}

export { EventTree };
