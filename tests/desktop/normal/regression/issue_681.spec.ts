import { test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test is a regression test for proving issue 681 is fixed for the given helioviewer
 * This is a bug related with duplicate event labels - Helioviewer should be able to differentiate
 * between 2 distinct events even though they have the same label but different IDs
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/681
 */
test("Issue 681, Duplicate event labels should be handled correctly", async ({ page }, info) => {
  // Mock CCMC events with duplicate labels (same label, different IDs)
  await page.route("*/**/*action=events&sources=CCMC*", async (route) => {
    await route.fulfill({ json: CCMC_DUPLICATE_LABELS_JSON });
  });

  // Mock HEK events with duplicate labels
  await page.route("*/**/*action=events&sources=HEK*", async (route) => {
    await route.fulfill({ json: HEK_DUPLICATE_LABELS_JSON });
  });

  // load helioviewer
  let hv = new Helioviewer(page, info);

  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  // Action 3: Open events drawer
  await hv.OpenEventsDrawer();

  // Action 4: Test CCMC events with duplicate labels
  const ccmcTree = hv.parseTree("CCMC");

  // Open Solar Flare Predictions > AMOS branch
  await ccmcTree.toggleBranchFRM("Solar Flare Predictions", "AMOS");

  // The key test: We should have 2 separate event instances with the same label "C+ 34.05% M+: 2.82%"
  // They should be independently selectable/manageable
  const duplicateLabel = "C+ 34.05% M+: 2.82%";
  const firstEventId = "ivo://helio-informatics.org/SFP_AMOS_20180904_001";
  const secondEventId = "ivo://helio-informatics.org/SFP_AMOS_20180904_002";

  // Toggle the event instance with duplicate label
  await ccmcTree.toggleCheckEventInstanceByLabel("Active Region", "SPoCA", duplicateLabel);

  // Both events with the same label should now be visible (if bug exists, only one will be)
  await ccmcTree.assertEventInstanceNodeChecked("Solar Flare Predictions", "AMOS", firstEventId);
  await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "AMOS", secondEventId);

  // Action 5: Test HEK events with duplicate labels
  const hekTree = hv.parseTree("HEK");

  await hekTree.toggleBranchFRM("Active Region", "SPoCA");

  // Similar test with HEK events - duplicate label "SPoCA 37775"
  const hekDuplicateLabel = "SPoCA 37775";
  const hekFirstEventId = "ivo://helio-informatics.org/AR_SPoCA_20180904_001";
  const hekSecondEventId = "ivo://helio-informatics.org/AR_SPoCA_20180904_002";

  // Toggle the event instance with duplicate label
  await hekTree.toggleCheckEventInstanceByLabel("Active Region", "SPoCA", hekDuplicateLabel);

  // Both events with the same label should be visible
  await hekTree.assertEventInstanceNodeChecked("Active Region", "SPoCA", hekFirstEventId);
  await hekTree.assertEventInstanceNodeUnchecked("Active Region", "SPoCA", hekSecondEventId);
});

// Mock data for CCMC events with duplicate labels
const CCMC_DUPLICATE_LABELS_JSON = [
  {
    name: "Solar Flare Predictions",
    pin: "SFP",
    groups: [
      {
        name: "AMOS",
        contact: "amos@example.com",
        url: "http://amos.example.com",
        data: [
          {
            active: "true",
            label: "C+ 34.05% M+: 2.82%",
            shortlabel: "C+ 34.05% M+: 2.82%",
            id: "ivo://helio-informatics.org/SFP_AMOS_20180904_001",
            type: "FL",
            event_type: "SFP",
            frm_name: "AMOS",
            concept: "Solar Flare Predictions",
            hpc_x: -500,
            hpc_y: 300,
            hv_hpc_x: -500,
            hv_hpc_y: 300,
            hv_hpc_x_final: -500,
            hv_hpc_y_final: 300,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-01T00:00:00",
            end: "2025-01-01T12:00:00"
          },
          {
            active: "true",
            label: "C+ 34.05% M+: 2.82%", // Same label, different ID
            shortlabel: "C+ 34.05% M+: 2.82%",
            id: "ivo://helio-informatics.org/SFP_AMOS_20180904_002",
            type: "FL",
            event_type: "SFP",
            frm_name: "AMOS",
            concept: "Solar Flare Predictions",
            hpc_x: 400,
            hpc_y: -250,
            hv_hpc_x: 400,
            hv_hpc_y: -250,
            hv_hpc_x_final: 400,
            hv_hpc_y_final: -250,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-01T06:00:00",
            end: "2025-01-01T18:00:00"
          },
          {
            active: "true",
            label: "C+ 77.15% M+: 9.08%",
            shortlabel: "C+ 77.15% M+: 9.08%",
            id: "ivo://helio-informatics.org/SFP_AMOS_20180904_003",
            type: "FL",
            event_type: "SFP",
            frm_name: "AMOS",
            concept: "Solar Flare Predictions",
            hpc_x: 200,
            hpc_y: 600,
            hv_hpc_x: 200,
            hv_hpc_y: 600,
            hv_hpc_x_final: 200,
            hv_hpc_y_final: 600,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-02T00:00:00",
            end: "2025-01-02T12:00:00"
          }
        ]
      }
    ]
  }
];

// Mock data for HEK events with duplicate labels
const HEK_DUPLICATE_LABELS_JSON = [
  {
    name: "Active Region",
    pin: "AR",
    groups: [
      {
        name: "SPoCA",
        contact: "spoca@example.com",
        url: "http://spoca.example.com",
        data: [
          {
            active: "true",
            label: "SPoCA 37775",
            shortlabel: "SPoCA 37775",
            id: "ivo://helio-informatics.org/AR_SPoCA_20180904_001",
            type: "AR",
            event_type: "AR",
            frm_name: "SPoCA",
            concept: "Active Region",
            hpc_x: -300,
            hpc_y: 500,
            hv_hpc_x: -300,
            hv_hpc_y: 500,
            hv_hpc_x_final: -300,
            hv_hpc_y_final: 500,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-01T00:00:00",
            end: "2025-01-01T12:00:00"
          },
          {
            active: "true",
            label: "SPoCA 37775", // Same label, different ID
            shortlabel: "SPoCA 37775",
            id: "ivo://helio-informatics.org/AR_SPoCA_20180904_002",
            type: "AR",
            event_type: "AR",
            frm_name: "SPoCA",
            concept: "Active Region",
            hpc_x: 350,
            hpc_y: -400,
            hv_hpc_x: 350,
            hv_hpc_y: -400,
            hv_hpc_x_final: 350,
            hv_hpc_y_final: -400,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-01T06:00:00",
            end: "2025-01-01T18:00:00"
          },
          {
            active: "true",
            label: "SPoCA 37776",
            shortlabel: "SPoCA 37776",
            id: "ivo://helio-informatics.org/AR_SPoCA_20180904_003",
            type: "AR",
            event_type: "AR",
            frm_name: "SPoCA",
            concept: "Active Region",
            hpc_x: 100,
            hpc_y: 200,
            hv_hpc_x: 100,
            hv_hpc_y: 200,
            hv_hpc_x_final: 100,
            hv_hpc_y_final: 200,
            hv_hpc_r_scaled: 1000,
            start: "2025-01-02T00:00:00",
            end: "2025-01-02T12:00:00"
          }
        ]
      }
    ]
  }
];
