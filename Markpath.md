# **MARKPATH**

## **Product Requirements Document (PRD)**

**Version:** 2.0  
**Product:** Markpath — Agentic Brand Operations Platform  
**Tagline:** From brand decisions to consistent execution.  
**Document status:** Updated PRD  
**Hackathon:** Flip the Switch

---

# **1\. Executive Summary**

Markpath is an agentic brand operations platform that helps companies maintain brand consistency across their digital products, design files, codebases, and marketing assets.

A company's brand guidelines may live in a PDF, design system, or shared document, but the actual implementation of those guidelines is distributed across tools such as Figma, GitHub, and Canva. As teams work, inconsistencies accumulate: outdated logos, incorrect colours, typography differences, obsolete design tokens, and inconsistent messaging.

Markpath connects these environments to an approved brand source of truth. Its specialised AI agents inspect connected resources, identify inconsistencies, coordinate proposed corrections, implement approved changes where supported, and independently verify the results.

Markpath has two essential interfaces:

1. **Web Dashboard — Control Centre:** Used to create brand workspaces, upload brand guidelines, manage integrations, configure permissions, review findings, approve changes, and monitor activity.  
2. **Switch-powered Team Chat — Operations Centre:** Used by people and agents to collaborate on everyday brand tasks, delegate work, report findings, request approvals, and coordinate execution.

The product is built around four core actions:

**Detect → Coordinate → Correct → Verify**

Markpath is not a brand design generator. It is an operational layer between a company's brand standards and how those standards are implemented across its organisation.

# **2\. Problem Statement**

Companies invest significant effort in creating brand identities and design systems. However, maintaining consistency after launch is difficult.

Brand rules are often documented in one place while their implementation is spread across several disconnected environments.

This creates recurring problems:

* Designers unknowingly use outdated logos, colours, fonts, and visual assets.  
* Developers implement outdated design tokens and components.  
* Marketing teams produce materials that do not follow approved brand standards.  
* Brand updates are implemented in one platform but missed in others.  
* Teams lack a shared process for identifying, reviewing, approving, and correcting inconsistencies.  
* Brand audits are often manual, infrequent, and difficult to scale.  
* There is no reliable record of which changes were approved, implemented, or independently verified.

The result is brand drift: the gradual divergence between the approved brand identity and its actual implementation.

Most existing brand management processes depend on human oversight and periodic reviews. Markpath aims to make brand consistency a continuous operational process.

# **3\. Product Vision**

**Help companies maintain their brand every day, not just change their brand once.**

Markpath should become the operational layer that connects brand guidelines to the tools where teams actually create, build, and publish.

A company should be able to:

1. Establish an approved brand source of truth.  
2. Connect its design, development, and marketing environments.  
3. Ask AI agents to inspect those environments.  
4. Identify brand inconsistencies and their locations.  
5. Review and approve proposed corrections.  
6. Allow agents to implement supported changes.  
7. Verify that the changes were successfully applied.  
8. Maintain a continuous record of brand health and activity.

# **4\. Goals and Non-Goals**

## **4.1 Product Goals**

* Provide a centralised and structured brand knowledge base.  
* Continuously inspect connected resources for brand inconsistencies.  
* Coordinate specialised AI agents through Switch.  
* Enable approved changes in connected platforms where supported.  
* Provide human approval and oversight for consequential changes.  
* Independently verify implemented changes.  
* Provide a web dashboard for workspace and brand operations.  
* Provide a collaborative chat environment for everyday tasks.  
* Maintain an auditable history of findings, approvals, and executions.

## **4.2 Non-Goals**

The initial product will not:

* Generate complete brand identities from scratch.  
* Replace professional designers or developers.  
* Automatically redesign every connected file.  
* Modify every resource in a connected workspace without user involvement.  
* Automatically publish production changes.  
* Directly merge GitHub pull requests.  
* Provide unrestricted editing of Canva designs.  
* Replace Figma, GitHub, Canva, or other connected platforms.  
* Build a separate proprietary team-chat platform.  
* Guarantee that every brand guideline can be automatically interpreted without human review.

# **5\. Target Users**

## **5.1 Primary Users**

**Brand Managers and Heads of Design**

Responsible for maintaining brand consistency across teams, products, and marketing channels.

**Design Leads and Product Designers**

Responsible for maintaining design systems, visual assets, components, and design standards.

**Engineering Leads and Developers**

Responsible for implementing design tokens, styles, assets, and components in codebases.

**Marketing Teams**

Responsible for creating campaigns, presentations, and other brand-facing materials.

## **5.2 Initial Customer Profile**

Startups and growing companies with:

* An established brand identity or design system.  
* Multiple people creating brand-facing materials.  
* A website or digital product.  
* A development team or external engineering partner.  
* Design and development resources spread across different platforms.

The initial focus is on companies that have already established brand standards but struggle to maintain consistency as they grow.

# **6\. Core Product Capabilities**

## **6.1 Brand Knowledge Management**

Markpath must provide a structured source of truth for each brand.

Users should be able to create a brand workspace and provide brand information through document uploads and manual configuration.

### **Supported brand information**

* Brand name and description.  
* Brand guidelines and documentation.  
* Primary and secondary logos.  
* Logo variations and usage restrictions.  
* Approved colour palettes.  
* Typography and font hierarchy.  
* Iconography and illustration rules.  
* Design tokens.  
* UI components and interaction styles.  
* Spacing, layout, and visual hierarchy.  
* Brand voice and messaging guidelines.  
* Approved exceptions.  
* Brand version and change history.  
* Brand owner and approval authority.

### **Brand guideline ingestion**

Users should be able to upload supported brand documents, especially PDF guidelines.

Markpath should extract relevant information and convert it into a structured brand specification.

The extraction process must:

1. Read the uploaded document.  
2. Identify relevant brand rules.  
3. Extract values and supporting references where possible.  
4. Identify unclear or missing information.  
5. Present the extracted specification for human review.  
6. Allow the authorised user to approve or edit the specification.

Markpath must not invent missing brand rules or treat uncertain interpretations as approved standards.

### **Brand specification**

The approved brand specification should be stored in a structured format, such as JSON, and versioned.

Example:

```
{
  "brand_name": "Nexa",
  "version": "2.0",
  "colours": {
    "primary": "#2457F5",
    "secondary": "#101828"
  },
  "typography": {
    "primary": "Geist",
    "fallback": "Arial"
  },
  "rules": {
    "logo_usage": "Use approved logo variants only",
    "button_radius": "8px"
  }
}
```

This is an illustrative structure, not a fixed schema. The final schema must support richer rules, references, exceptions, and validation metadata.

## **6.2 Brand Auditing**

Markpath must inspect connected resources and compare their actual implementation against the approved brand specification.

### **Initial audit targets**

**Figma**

* Colours and variables.  
* Typography and text styles.  
* Components and supported properties.  
* Logos and image assets.  
* Design system inconsistencies.

**GitHub**

* CSS variables.  
* Design tokens.  
* Typography definitions.  
* Component styles.  
* Logo and brand asset references.  
* Relevant configuration and theme files.

**Canva**

* Eligible brand templates.  
* Supported design fields.  
* Brand colours and text fields.  
* Generated marketing assets.

### **Finding structure**

Every finding should contain:

* Finding ID.  
* Brand workspace.  
* Connected platform.  
* Resource name and URL.  
* File, page, component, or code location.  
* Rule being checked.  
* Detected value.  
* Expected value.  
* Supporting evidence.  
* Severity.  
* Confidence score.  
* Recommended correction.  
* Current status.  
* Timestamp.

### **Finding classification**

Markpath should distinguish between:

* **Confirmed violation:** Clear evidence that an approved rule is being violated.  
* **Possible inconsistency:** Evidence suggests a mismatch but requires further inspection.  
* **Needs human review:** Insufficient information to make a reliable determination.  
* **Compliant:** The inspected resource satisfies the relevant rule.

The system must not present uncertain findings as confirmed violations.

## **6.3 Brand Change Coordination**

When a brand rule changes, Markpath should identify connected resources that may be affected.

For example, changing the primary brand colour should trigger an impact assessment across:

* Figma variables and styles.  
* GitHub design tokens and UI components.  
* Eligible Canva templates.

The Brand Director Agent should coordinate the process, identify affected resources, assign work, and prepare a proposed implementation plan.

## **6.4 Approved Change Implementation**

Markpath should implement supported changes only after explicit approval.

The implementation process must:

1. Identify the affected resource.  
2. Determine whether the requested operation is supported.  
3. Prepare a specific change proposal.  
4. Display the expected changes.  
5. Request approval from an authorised user.  
6. Execute the approved operation.  
7. Record the execution result.  
8. Independently verify the result.

An approval must be tied to the specific resource and proposed action. Approval of one operation must not automatically authorise unrelated changes.

## **6.5 Verification and Reporting**

The Brand QA Agent must independently inspect the affected resources after implementation.

Verification should confirm:

* The intended value or property was changed.  
* The change exists in the actual resource.  
* Unrelated resources were not modified.  
* The relevant brand rule is now satisfied.  
* The implementation did not introduce another detectable inconsistency.

An API success response alone does not establish successful completion.

If only some resources are updated, the overall task must be marked as partially completed.

# **7\. Agent Architecture**

Markpath uses four specialised agents working together through Switch.

## **7.1 Brand Director Agent**

**Role:** Primary coordinator and user-facing agent.

Responsibilities:

* Receive requests from users.  
* Interpret brand-related tasks.  
* Retrieve relevant brand specifications.  
* Determine which agents are needed.  
* Delegate tasks through Switch.  
* Track task progress.  
* Consolidate agent findings.  
* Prepare implementation plans.  
* Request human approval.  
* Communicate execution results.  
* Escalate uncertainty and unsupported operations.

The Brand Director must not claim that a task is complete without verification evidence.

## **7.2 Design Agent**

**Role:** Design environment specialist.

Responsibilities:

* Inspect connected Figma files.  
* Inspect supported design-system properties.  
* Identify outdated colours, typography, assets, and components.  
* Compare design resources against approved brand rules.  
* Prepare design corrections.  
* Apply approved changes through supported Figma capabilities.  
* Work with eligible Canva templates where configured.  
* Report unsupported operations and execution limitations.

## **7.3 Implementation Agent**

**Role:** Codebase and implementation specialist.

Responsibilities:

* Inspect connected GitHub repositories.  
* Identify outdated design tokens and brand-related styles.  
* Locate relevant components and assets.  
* Prepare focused code changes.  
* Request approval before execution.  
* Create a dedicated Git branch.  
* Commit approved changes.  
* Open a pull request.  
* Report test and validation results.

The Implementation Agent must not directly modify the default branch or automatically merge a pull request.

## **7.4 Brand QA Agent**

**Role:** Independent quality assurance and verification.

Responsibilities:

* Review findings from other agents.  
* Check whether proposed changes satisfy the approved specification.  
* Independently inspect updated resources.  
* Identify incomplete or conflicting changes.  
* Validate execution evidence.  
* Flag possible regressions.  
* Produce the final verification report.

The QA Agent should not simply accept another agent's completion claim as proof.

# **8\. Switch Integration and Collaboration**

Switch is the collaboration infrastructure connecting Markpath's agents and human users.

It provides shared chat rooms where people and agents can communicate, delegate work, share context, and coordinate tasks.

Markpath will use Switch as its agent collaboration layer rather than developing a separate chat system.

## **8.1 Switch Responsibilities**

* Connect agents to shared rooms.  
* Allow human users to interact with agents.  
* Enable agent-to-agent delegation.  
* Maintain shared conversation context.  
* Support mentions and task handoffs.  
* Allow agents to report findings and progress.  
* Provide a collaborative environment for approvals and coordination.

## **8.2 Markpath Responsibilities**

* Configure the required agents.  
* Define agent roles and permissions.  
* Provide brand-specific context.  
* Route tasks to the correct agent.  
* Track tasks and execution records.  
* Connect external integrations.  
* Manage approvals.  
* Display operational information in the dashboard.

## **8.3 Chat Platform Support**

Switch supports integrations with platforms including:

* Mattermost.  
* Slack.  
* Telegram.  
* Discord.  
* Microsoft Teams.

The MVP should prioritise the fastest verified setup, preferably the bundled Mattermost environment.

Slack or Telegram may be used if their connector setup can be completed and tested within the available time.

Markpath must only display a platform as connected when the connection has actually been established and validated.

## **8.4 Example Collaboration**

A Head of Design sends a message:

"@Brand Director, we've updated the Nexa brand identity. The primary blue is now \#2457F5 and we've moved to Geist. Check our Figma file and GitHub repository for outdated values."

The Brand Director:

1. Reads the approved brand specification.  
2. Creates a brand change task.  
3. Delegates Figma inspection to the Design Agent.  
4. Delegates repository inspection to the Implementation Agent.  
5. Receives their findings.  
6. Consolidates the impact assessment.  
7. Presents the proposed changes to the user.  
8. Waits for approval.  
9. Coordinates implementation.  
10. Assigns independent verification to the QA Agent.  
11. Reports the final results.

# **9\. Platform Integrations**

The integration priority is:

1. Figma — primary.  
2. GitHub — primary.  
3. Canva — secondary.

The product must be honest about the capabilities and limitations of each integration.

## **9.1 Figma Integration**

Figma is a core integration because it is where many companies maintain their design systems and visual assets.

Markpath should support two complementary integration paths.

### **A. Figma REST API**

Use the official Figma API for supported file inspection and operations.

Potential capabilities include:

* Retrieve supported file information.  
* Inspect supported nodes and properties.  
* Read supported variables and styles.  
* Access supported comments and metadata where required.  
* Use documented write endpoints when the account, scopes, permissions, and API capabilities allow them.

**Important limitation:** Figma Variables API write access has account, seat, permission, and scope requirements. Markpath must validate the actual account's eligibility before promising REST-based variable updates.

### **B. Markpath Figma Plugin**

The Figma plugin is the primary write-capable fallback for supported design operations.

The user launches the plugin inside Figma and operates on the currently open file.

The plugin should:

1. Identify the active file.  
2. Inspect supported design properties.  
3. Retrieve relevant brand rules from Markpath.  
4. Compare detected values against approved values.  
5. Display findings.  
6. Receive approved update instructions.  
7. Apply supported corrections.  
8. Return execution evidence to Markpath.  
9. Re-inspect the affected elements to verify the changes.

### **Plugin limitations**

* The plugin operates on the active file and supported Plugin API capabilities.  
* It is not an unattended background service.  
* It cannot automatically modify every file in a workspace.  
* Some properties or operations may not be exposed through the Plugin API.  
* User permissions and file access still apply.

### **Figma MVP acceptance criteria**

* A user can launch the Markpath plugin in Figma.  
* The plugin can inspect a real supported file.  
* It can identify at least one known outdated brand value.  
* It displays the detected value and expected value.  
* The user can approve a proposed correction.  
* The plugin applies the supported correction.  
* The plugin re-inspects the resource and returns verification evidence.

## **9.2 GitHub Integration**

GitHub is the primary integration for inspecting and maintaining brand implementation in codebases.

Use a GitHub App or an appropriately configured authentication method.

### **Required capabilities**

* Connect a GitHub account or organisation.  
* Select repositories.  
* Inspect relevant source files.  
* Detect brand-related implementation inconsistencies.  
* Identify outdated CSS variables and design tokens.  
* Inspect relevant component styles and brand assets.  
* Prepare focused change sets.  
* Create dedicated branches.  
* Commit approved changes.  
* Open pull requests.  
* Inspect available CI checks.  
* Verify the resulting changes.

### **Permissions**

Request the minimum permissions required for supported operations.

Expected permissions include:

* Repository metadata read.  
* Repository contents read and write.  
* Pull requests read and write.

The exact permissions must be validated against the operations being implemented.

### **Execution rules**

* Never edit the default branch directly.  
* Never automatically merge pull requests.  
* Never change unrelated application logic.  
* Never modify dependencies, secrets, or deployment workflows as part of a brand correction unless separately authorised.  
* Keep each change focused on the approved task.  
* Record the branch, commit, PR, and verification evidence.

### **GitHub MVP acceptance criteria**

* Connect a real GitHub account.  
* Select a test repository.  
* Identify a known outdated brand token.  
* Propose a specific correction.  
* Obtain human approval.  
* Create a branch and commit.  
* Open a pull request.  
* Confirm that the default branch remains unchanged.  
* Verify that the PR contains only the intended changes.

## **9.3 Canva Integration**

Canva is a secondary integration for companies that use Canva to create marketing assets.

Use the official Canva Connect APIs and OAuth.

The initial implementation should focus on supported Autofill workflows and eligible brand templates.

### **Supported scope**

* Authenticate a Canva account.  
* Retrieve eligible templates and datasets.  
* Identify supported template fields.  
* Populate approved brand values.  
* Generate or update designs using supported Autofill operations.  
* Check asynchronous job status.  
* Retrieve the generated design.  
* Present the result for human review.

### **Limitations**

* Canva Autofill requires eligible templates and supported fields.  
* Account eligibility, developer access, permissions, and API scopes must be validated.  
* It is not a universal editor for arbitrary Canva designs.  
* Markpath must not claim unrestricted access to all existing designs.

### **Canva MVP acceptance criteria**

* Authenticate an eligible Canva account.  
* Retrieve an eligible template and dataset.  
* Populate supported fields.  
* Generate a design through the supported API.  
* Retrieve the resulting design.  
* Display its status and provide an accessible result.  
* Report failures or unsupported operations clearly.

## **9.4 Future Integrations**

Potential future integrations include:

* Webflow CMS.  
* Additional website platforms.  
* Additional design tools.  
* Marketing asset libraries.  
* Documentation and knowledge management tools.

These are outside the initial MVP unless the core workflows are already functional.

# **10\. Dashboard — Markpath Control Centre**

The dashboard is a mandatory part of the product.

It is the main interface for setting up and managing a company's Markpath workspace.

The dashboard must not be treated as an optional visual wrapper around the agents.

It establishes the brand context, integrations, permissions, and operational records that make the agent workflows possible.

## **10.1 Dashboard Objectives**

Users should be able to:

* Create and manage a brand workspace.  
* Upload and manage brand guidelines.  
* Review and approve extracted brand information.  
* Connect Figma, GitHub, and Canva.  
* Install and configure the Figma plugin.  
* Select repositories and other resources.  
* Connect Switch and configure a team chat room.  
* Configure agent access and permissions.  
* Start brand audits.  
* Review findings.  
* Approve or reject proposed changes.  
* Monitor execution and verification.  
* View agent activity and task history.

## **10.2 Dashboard Navigation**

The MVP should contain five primary sections.

### **Page 1: Overview**

The landing page after authentication.

It should display:

* Brand name and current brand version.  
* Overall brand health status.  
* Number of connected platforms.  
* Number of open findings.  
* Critical and high-severity issues.  
* Pending approvals.  
* Recently completed changes.  
* Recent agent activity.  
* Quick action to start a brand audit.

Brand health should be presented as a transparent, evidence-based indicator. Do not introduce an arbitrary score without a defined calculation.

### **Page 2: Brand Profile**

The central brand knowledge management page.

Features:

* Upload brand guidelines.  
* Add brand description and information.  
* Upload logos and approved assets.  
* Manage colour palettes.  
* Define typography.  
* Add brand rules.  
* Review extracted information.  
* Edit and approve the brand specification.  
* View brand version and change history.

Users must be able to distinguish between extracted information, manually entered information, and approved rules.

### **Page 3: Integrations**

The central integration management page.

It should include:

**Figma**

* Connection status.  
* REST API authentication where applicable.  
* Figma plugin installation instructions.  
* Active file access and supported capabilities.  
* Last successful inspection.

**GitHub**

* Account or organisation connection.  
* Repository selection.  
* Permission status.  
* Last successful inspection.

**Canva**

* OAuth connection.  
* Eligible template status.  
* Autofill capability status.

**Switch**

* Server or environment connection status.  
* Available chat platform.  
* Room or channel configuration.  
* Agent membership status.

The dashboard must show accurate connection states such as:

* Not connected.  
* Connecting.  
* Connected.  
* Permission required.  
* Authentication expired.  
* Error.

### **Page 4: Issues and Approvals**

A central location for reviewing findings and proposed changes.

Features:

* List of detected brand inconsistencies.  
* Filter by platform.  
* Filter by severity.  
* Filter by status.  
* View finding evidence.  
* Compare detected and expected values.  
* View recommended corrections.  
* Approve proposed changes.  
* Reject proposed changes.  
* Request revisions.  
* View implementation and verification status.

Approvals must be linked to specific proposed operations.

### **Page 5: Agent Activity**

A record of agent operations.

Display:

* Agent name and role.  
* Task description.  
* Assigned resource.  
* Current task status.  
* Task start and completion time.  
* Findings and outputs.  
* Approval state.  
* Execution result.  
* Verification evidence.  
* Errors and failure reasons.

This page should make it clear what the agents have done, what they are doing, and what still requires human action.

## **10.3 Dashboard Onboarding Flow**

A new company should be able to set up Markpath through the following flow:

**Step 1 — Create Workspace**

* Create an account.  
* Create a company or brand workspace.  
* Enter brand name and basic details.

**Step 2 — Add Brand Guidelines**

* Upload brand guidelines.  
* Upload approved logos and assets.  
* Extract relevant brand information.  
* Review and approve the generated brand specification.

**Step 3 — Connect Platforms**

* Connect Figma.  
* Install the Figma plugin.  
* Connect GitHub.  
* Select repositories.  
* Connect Canva where applicable.

**Step 4 — Configure Switch**

* Connect the Switch environment.  
* Select or configure the supported chat platform.  
* Create or join a Markpath operations room.  
* Add the required agents.  
* Verify that the agents can communicate.

**Step 5 — Configure Permissions**

* Set authorised approvers.  
* Define integration permissions.  
* Confirm which operations agents can perform.  
* Ensure approval is required for consequential changes.

**Step 6 — Run First Audit**

* Select connected resources.  
* Start the first audit.  
* Allow the agents to inspect the resources.  
* Review findings in the dashboard and chat.

## **10.4 Dashboard and Chat Responsibilities**

| Capability | Dashboard | Switch Chat |
| ----- | ----- | ----- |
| Create brand workspace | Primary | No |
| Upload brand guidelines | Primary | Context or reference only |
| Approve brand specification | Primary | Optional interaction |
| Connect integrations | Primary | No |
| Configure permissions | Primary | No |
| Start audits | Yes | Yes |
| Request brand reviews | Yes | Yes |
| Delegate agent work | Via backend/workflow | Primary collaboration layer |
| View findings | Yes | Yes |
| Approve changes | Primary interface | Supported conversational approval if securely implemented |
| Monitor agent activity | Primary | Live updates |
| View audit history | Primary | Conversation history |

The dashboard manages the system. Switch enables collaboration inside the system.

## **10.5 Dashboard MVP Scope**

The first release must have:

* Working authentication.  
* Workspace creation.  
* Brand profile creation.  
* Guideline upload.  
* Brand specification review and approval.  
* Integration connection status.  
* A working path to configure Switch.  
* Overview page.  
* Findings and approval page.  
* Agent activity page.

Advanced analytics, multiple workspace roles, elaborate reporting, and complex team administration can follow after the core workflows work.

# **11\. Continuous Brand Operations**

Markpath must support recurring brand maintenance rather than being limited to one-time audits or rebranding exercises.

The product should support three operating modes.

## **11.1 On-Demand Operations**

Users can request specific work through the dashboard or chat.

Examples:

* "Review this campaign asset."  
* "Audit our website repository."  
* "Check whether this Figma file follows our current brand guidelines."  
* "Find outdated brand colours across our connected resources."  
* "Review our new logo implementation."

## **11.2 Event-Driven Operations**

Where a platform supports webhooks or relevant event notifications, Markpath should trigger inspections when resources change.

Examples:

* A GitHub pull request is opened.  
* A relevant file is updated.  
* A supported design resource changes.  
* A new eligible marketing asset is submitted for review.

Event-driven monitoring must only be implemented where the relevant integration actually supports the required event access.

## **11.3 Scheduled Operations**

Markpath should eventually support recurring checks.

Examples:

* Daily checks of selected repositories.  
* Weekly design-system reviews.  
* Scheduled brand health reports.  
* Periodic checks of eligible marketing assets.

Scheduled monitoring is a post-MVP priority unless the underlying workflow is already stable.

# **12\. Core User Workflows**

## **Workflow A: New Brand Setup**

1. User creates a Markpath account.  
2. User creates a brand workspace.  
3. User uploads brand guidelines.  
4. Markpath extracts relevant brand information.  
5. User reviews and approves the specification.  
6. User connects Figma and GitHub.  
7. User optionally connects Canva.  
8. User configures Switch and the operations room.  
9. User verifies agent availability.  
10. User starts the first audit.

**Expected result:** A configured brand workspace with an approved brand specification and connected resources.

## **Workflow B: Everyday Asset Review**

1. User requests an asset review in chat or through the dashboard.  
2. Brand Director identifies the relevant resource.  
3. Design Agent inspects the resource.  
4. The agent compares the resource against approved brand rules.  
5. Brand QA reviews the findings.  
6. Brand Director reports the result.  
7. User receives recommendations and, where necessary, an approval request.

**Expected result:** A clear review report showing compliant elements, confirmed violations, uncertainties, and recommended actions.

## **Workflow C: Brand Change Propagation**

1. Authorised user requests a brand change.  
2. Brand Director checks the approved brand specification and user permissions.  
3. The proposed brand specification change is reviewed and approved.  
4. Brand Director identifies affected resources.  
5. Design Agent inspects Figma and eligible Canva resources.  
6. Implementation Agent inspects GitHub.  
7. Agents return findings and an impact assessment.  
8. Brand Director consolidates the implementation plan.  
9. User approves each consequential proposed operation.  
10. Agents execute supported changes.  
11. Brand QA independently verifies the results.  
12. Dashboard and chat display the final report.

**Expected result:** Approved changes are implemented across supported resources, with a clear record of completed, partial, and failed operations.

## **Workflow D: Website Brand Correction**

1. User requests a repository audit.  
2. Implementation Agent inspects the selected GitHub repository.  
3. The agent identifies outdated tokens or brand-related styles.  
4. The agent proposes focused changes.  
5. User approves the proposed change set.  
6. Agent creates a dedicated branch.  
7. Agent commits the approved changes.  
8. Agent opens a pull request.  
9. QA checks the resulting diff and relevant tests.  
10. Dashboard records the PR and verification status.  
11. Human reviews and merges the PR through GitHub.

**Expected result:** A focused, reviewable pull request with no direct default-branch modification.

## **Workflow E: Canva Campaign Asset**

1. User requests an update to an eligible campaign template.  
2. Design Agent checks the connected Canva account and template.  
3. Agent retrieves the supported dataset.  
4. Agent prepares approved brand values for eligible fields.  
5. User reviews and approves the proposed operation.  
6. Agent runs the Autofill workflow.  
7. Agent checks job status.  
8. Agent retrieves the generated design.  
9. QA checks the available output.  
10. User reviews the result.

**Expected result:** A generated or updated design using a supported template and documented Autofill operation.

# **13\. Workflow and Task State Management**

Every operation must have a trackable status.

## **13.1 Main Workflow States**

| State | Description |
| ----- | ----- |
| RECEIVED | Request has been received. |
| ASSESSING | Brand Director is interpreting the request. |
| AUDITING | Agents are inspecting resources. |
| PLAN\_READY | Findings and proposed actions are ready. |
| AWAITING\_APPROVAL | Human approval is required. |
| APPROVED | Proposed operation has been approved. |
| IMPLEMENTING | Approved changes are being executed. |
| VERIFYING | QA is checking the results. |
| COMPLETED | All required operations are verified. |
| PARTIALLY\_COMPLETED | Some operations succeeded while others did not. |
| FAILED | Execution failed. |
| REJECTED | Proposed operation was rejected. |

## **13.2 Multi-Resource Tasks**

A single request may affect multiple resources.

Each resource must maintain its own status.

For example:

* Figma: Completed and verified.  
* GitHub: PR opened, awaiting human merge.  
* Canva: Failed because the selected template is ineligible.

The overall task must report these results individually rather than presenting the entire request as completed.

## **13.3 Completion Requirements**

A task can only be marked COMPLETED when all required operations have been executed and independently verified.

Where human action remains, such as merging a pull request, the task should clearly communicate that dependency.

# **14\. Functional Requirements**

## **14.1 Workspace and Brand Management**

**FR-01:** Users must be able to register and authenticate.

**FR-02:** Users must be able to create and manage a brand workspace.

**FR-03:** Users must be able to upload supported brand guideline documents.

**FR-04:** The system must extract brand information into a structured specification.

**FR-05:** Users must be able to review, edit, and approve extracted brand rules.

**FR-06:** The system must maintain brand specification versions and change history.

## **14.2 Integration Management**

**FR-07:** Users must be able to connect supported integrations.

**FR-08:** Users must be able to select the repositories and resources Markpath can inspect.

**FR-09:** The system must display accurate integration and permission status.

**FR-10:** Users must be able to install and configure the Markpath Figma plugin.

**FR-11:** Users must be able to configure the Switch environment and operations room.

## **14.3 Agent Operations**

**FR-12:** The Brand Director must be able to delegate tasks to specialised agents.

**FR-13:** Agents must be able to communicate and exchange task results through Switch.

**FR-14:** Agents must inspect resources against the approved brand specification.

**FR-15:** Findings must include evidence, severity, confidence, and recommended action.

**FR-16:** The system must maintain task status and agent activity.

## **14.4 Approvals and Execution**

**FR-17:** Consequential changes must require explicit human approval.

**FR-18:** Approval must be tied to the specific resource and proposed operation.

**FR-19:** The system must support approved Figma operations through documented REST capabilities or the Figma plugin.

**FR-20:** The system must support approved GitHub branch and pull request operations.

**FR-21:** The system must support eligible Canva Autofill operations where account and template requirements are satisfied.

**FR-22:** The system must record execution results and errors.

**FR-23:** The QA Agent must independently verify completed operations.

**FR-24:** The system must distinguish completed, partially completed, failed, and rejected tasks.

## **14.5 Dashboard**

**FR-25:** The dashboard must provide a workspace overview.

**FR-26:** The dashboard must provide brand profile and guideline management.

**FR-27:** The dashboard must provide integration management.

**FR-28:** The dashboard must provide findings and approval management.

**FR-29:** The dashboard must provide agent activity and task history.

**FR-30:** The dashboard must allow users to initiate brand audits.

**FR-31:** The dashboard must show pending user actions and approval requests.

**FR-32:** The dashboard must reflect task and integration status accurately.

**FR-33:** The dashboard must provide an auditable history of consequential operations.

# **15\. Data Model**

The following is the initial logical data model. The implementation may refine individual fields and relationships.

## **15.1 Brand**

* `id`  
* `name`  
* `description`  
* `brand_specification`  
* `brand_version`  
* `approval_owner`  
* `created_at`  
* `updated_at`

## **15.2 User and Membership**

* `id`  
* `email`  
* `name`  
* `created_at`

Workspace membership:

* `id`  
* `user_id`  
* `brand_id`  
* `role`  
* `created_at`

## **15.3 Integration**

* `id`  
* `brand_id`  
* `provider`  
* `connection_status`  
* `external_account_id`  
* `permissions`  
* `last_checked_at`  
* `created_at`

Credentials must be stored securely and must not be exposed through ordinary application records.

## **15.4 Resource**

* `id`  
* `brand_id`  
* `integration_id`  
* `resource_type`  
* `external_resource_id`  
* `resource_name`  
* `resource_url`  
* `last_inspected_at`  
* `status`

## **15.5 Finding**

* `id`  
* `brand_id`  
* `resource_id`  
* `rule_id`  
* `detected_value`  
* `expected_value`  
* `severity`  
* `confidence`  
* `evidence`  
* `recommended_action`  
* `status`  
* `created_at`

## **15.6 Task**

* `id`  
* `brand_id`  
* `task_type`  
* `description`  
* `initiated_by`  
* `assigned_agent`  
* `status`  
* `approval_status`  
* `created_at`  
* `completed_at`

## **15.7 Approval**

* `id`  
* `task_id`  
* `resource_id`  
* `requested_by`  
* `approved_by`  
* `decision`  
* `approved_action`  
* `created_at`

## **15.8 Execution Record**

* `id`  
* `task_id`  
* `integration_id`  
* `resource_id`  
* `operation`  
* `result`  
* `evidence`  
* `error`  
* `executed_at`

## **15.9 Agent Activity**

* `id`  
* `brand_id`  
* `task_id`  
* `agent_name`  
* `activity_type`  
* `message_reference`  
* `status`  
* `created_at`

The application must preserve traceability between a request, its agent handoffs, approval, execution, and verification.

# **16\. Technical Architecture**

## **16.1 Recommended Stack**

| Layer | Technology | Purpose |
| ----- | ----- | ----- |
| Frontend | Next.js \+ TypeScript | Dashboard |
| UI | Tailwind CSS \+ shadcn/ui | Interface components |
| Backend | Next.js server routes or lightweight TypeScript service | Application logic and integrations |
| Database | PostgreSQL / Supabase | Persistent application data |
| Authentication | Supabase Auth or equivalent | User authentication |
| File storage | Supabase Storage | Brand guidelines and assets |
| Collaboration | Switch | Human-agent and agent-agent communication |
| Agent runtime | Supported Claude Code, Codex, or compatible runtime | Agent execution |
| Design integration | Figma REST API \+ Figma Plugin | Design inspection and supported modifications |
| Development integration | GitHub App | Repository inspection and PR creation |
| Marketing integration | Canva Connect API | Eligible template and Autofill operations |

## **16.2 High-Level Architecture**

```
                   MARKPATH WEB DASHBOARD
                            |
                            |
                     MARKPATH BACKEND
                            |
           +----------------+----------------+
           |                |                |
       PostgreSQL       File Storage     Integration
       / Supabase       Brand Assets      Services
           |                |                |
           +----------------+----------------+
                            |
                     BRAND SPECIFICATION
                            |
                     TASK ORCHESTRATION
                            |
                          SWITCH
                            |
                SHARED OPERATIONS ROOM
                            |
          +-----------------+-----------------+
          |                 |                 |
    Brand Director      Design Agent    Implementation
          |                 |             Agent
          +-----------------+-----------------+
                            |
                       Brand QA Agent
                            |
                    VERIFICATION RESULTS
                            |
                  MARKPATH BACKEND
                            |
                   DASHBOARD + CHAT
                            |
           +----------------+----------------+
           |                |                |
          Figma           GitHub           Canva
```

## **16.3 Architectural Responsibilities**

**Dashboard:** User-facing configuration and operational management.

**Backend:** Authentication, workspace management, brand data, approvals, task records, integration orchestration, and persistence.

**Switch:** Agent collaboration, room messaging, task handoffs, and human-agent communication.

**Agent Runtime:** Reasoning, task execution, resource inspection, and tool usage.

**Integration Services:** Secure access to external platforms and execution of supported operations.

**Database:** Persistent records of brands, users, integrations, findings, approvals, tasks, and execution history.

The dashboard must not attempt to implement a separate Switch messaging system.

## **16.4 Integration Security**

* Store credentials on the server.  
* Use official OAuth or authentication methods.  
* Request minimum necessary permissions.  
* Keep secrets out of browser code, chat messages, and ordinary agent outputs.  
* Validate all external requests.  
* Scope operations to the selected workspace and resources.  
* Log consequential actions.  
* Handle token expiry and revocation.

# **17\. Security and Human Oversight**

Human oversight is a core product requirement.

## **17.1 Approval Rules**

Require explicit approval before:

* Modifying Figma resources.  
* Writing to GitHub repositories.  
* Generating or updating Canva designs.  
* Changing the approved brand specification.  
* Performing other consequential operations.

An authorised user may approve or reject a specific proposed action.

## **17.2 Least-Privilege Access**

Agents should only access resources required for their assigned tasks.

Examples:

* Design Agent receives the relevant Figma resource access.  
* Implementation Agent receives access to selected repositories.  
* Canva operations are limited to eligible templates and approved fields.

## **17.3 Audit Trail**

Record:

* User who initiated the request.  
* Agent assigned to the task.  
* Platform and resource involved.  
* Proposed operation.  
* Approval decision.  
* User who approved or rejected.  
* Execution result.  
* Verification result.  
* Relevant timestamps.

## **17.4 Failure Handling**

The system must account for:

* Expired or revoked authentication.  
* Insufficient permissions.  
* Rate limits.  
* API failures.  
* Stale resources.  
* Unsupported operations.  
* Partial execution.  
* Duplicate requests.  
* Failed verification.  
* Agent timeouts.

Retries must be controlled and idempotent where possible. The system must not silently repeat consequential operations.

# **18\. Non-Functional Requirements**

## **Reliability**

* Task state must persist across application restarts.  
* Failed operations must have visible error states.  
* Partial success must be reported accurately.  
* The system must not report unverified changes as complete.

## **Security**

* Integration credentials must remain server-side.  
* Workspace data must be isolated.  
* Operations must respect user permissions.  
* Consequential actions must be auditable.

## **Usability**

* The dashboard must be understandable to non-technical brand managers.  
* Findings must show clear detected-versus-expected comparisons.  
* Approval requests must explain exactly what will change.  
* Errors must communicate the reason and next action.

## **Maintainability**

* Integrations should be modular.  
* Agent responsibilities should remain clearly separated.  
* Task execution and approval logic should be reusable.  
* Brand rules should be stored independently of agent prompts.

# **19\. MVP Scope and Implementation Priorities**

The hackathon MVP must demonstrate an actual collaborative workflow rather than a collection of disconnected mockups.

## **P0 — Essential**

**Dashboard foundation**

* Authentication.  
* Workspace creation.  
* Brand profile.  
* Guideline upload.  
* Brand specification review and approval.  
* Overview.  
* Integration status.  
* Findings and approvals.  
* Agent activity.

**Switch collaboration**

* Working Switch environment.  
* Shared operations room.  
* Configured agents.  
* Actual agent-to-agent handoffs.  
* Human interaction with agents.

**GitHub**

* Real repository connection.  
* Repository inspection.  
* Brand inconsistency detection.  
* Approval flow.  
* Branch and PR creation.  
* Verification.

**Figma**

* Working plugin installation.  
* Active file inspection.  
* Detection of a known outdated brand value.  
* Human approval.  
* Supported correction.  
* Verification.

**Core operations**

* Task state management.  
* Approval records.  
* Execution records.  
* Final verification report.

## **P1 — Secondary**

* Canva OAuth.  
* Eligible template retrieval.  
* Autofill generation.  
* Additional audit coverage.  
* Improved activity history.  
* Basic recurring audits.

## **P2 — Future**

* Webflow integration.  
* More design and marketing platforms.  
* Automated event-driven monitoring.  
* Advanced reporting and brand health analytics.  
* Multiple workspace roles and advanced governance.  
* Organisation-wide brand governance.

## **19.1 Recommended Build Order**

1. Establish the Next.js and Supabase foundation.  
2. Build workspace creation and the brand profile.  
3. Build the dashboard's core navigation and overview.  
4. Configure Switch and create the operations room.  
5. Set up the four agents and validate handoffs.  
6. Implement GitHub inspection and PR workflow.  
7. Implement the Figma plugin inspection and write workflow.  
8. Connect approvals and verification to persistent records.  
9. Display live findings and agent activity in the dashboard.  
10. Implement Canva if sufficient time remains.  
11. Test the end-to-end workflow.  
12. Prepare documentation and the demo.

The dashboard must be built early enough to support real operations. However, visual polish must not take priority over a functioning end-to-end workflow.

# **20\. Hackathon Demonstration Scenario**

## **Scenario: Nexa Fintech — Brand Version 2.0**

Nexa is a fictional fintech company that has recently updated its brand identity.

Its previous identity uses:

* Primary blue: `#164B9B`  
* Typeface: Inter  
* Old logo.  
* Previous button and input styles.

The updated identity uses:

* Primary blue: `#2457F5`  
* Typeface: Geist.  
* New approved logo.  
* Updated button and input styles.

The company's Figma file and GitHub repository still contain outdated values.

## **Demonstration Flow**

**1\. Create the brand workspace**

Open the Markpath dashboard and create a Nexa workspace.

**2\. Establish brand knowledge**

Upload the new brand guidelines, extract the updated values, and approve the brand specification.

**3\. Connect platforms**

Connect the Figma file and GitHub test repository. Configure Switch and the operations room.

**4\. Initiate the request**

The Head of Design sends:

"@Brand Director, Nexa has updated its brand identity. Audit our Figma file and GitHub repository for outdated brand values and prepare the necessary corrections."

**5\. Demonstrate agent collaboration**

Brand Director delegates to Design Agent and Implementation Agent through Switch.

**6\. Inspect Figma**

Design Agent inspects the active Figma file and identifies the outdated blue or another known supported property.

It reports the detected value, expected value, affected resource, and proposed correction.

**7\. Inspect GitHub**

Implementation Agent inspects the test repository and identifies the outdated colour token.

It prepares a focused change proposal.

**8\. Obtain human approval**

The user reviews the proposed changes and approves the specific operations.

**9\. Implement changes**

* Design Agent applies the supported correction through the Figma plugin.  
* Implementation Agent creates a branch and opens a pull request.

**10\. Verify**

Brand QA independently checks both resources and returns evidence.

**11\. Display the outcome**

The dashboard shows the task status, affected resources, approvals, execution records, and verification results.

Canva may be included as an additional demonstration if its eligible template and API workflow are fully operational.

The demo must clearly distinguish between actual completed operations, operations awaiting human action, and unsupported or failed operations.

# **21\. Success Metrics**

## **MVP Product Metrics**

* A user can create a brand workspace.  
* A user can establish an approved brand specification.  
* At least two priority integrations can be connected and used.  
* Agents can collaborate through Switch.  
* The system can identify known brand inconsistencies.  
* A user can approve a proposed change.  
* At least one real supported change can be executed.  
* The system can independently verify the change.  
* The dashboard accurately reflects findings and task states.

## **Operational Metrics**

Future product measurement should include:

* Number of resources audited.  
* Number of confirmed inconsistencies detected.  
* Percentage of findings verified by QA.  
* Number of approved changes executed.  
* Percentage of operations successfully verified.  
* Average time from detection to resolution.  
* Frequency of recurring brand inconsistencies.  
* Number of human interventions required.

Avoid using raw agent activity or the number of messages exchanged as a proxy for product value.

# **22\. Key Risks and Mitigations**

| Risk | Mitigation |
| ----- | ----- |
| Figma API write limitations | Use the Figma plugin for supported write operations. |
| Figma plugin API limitations | Clearly define supported properties and operations. |
| GitHub permissions and security | Use a GitHub App with minimum permissions. |
| Canva eligibility restrictions | Limit initial scope to eligible Autofill templates. |
| Agent coordination failures | Use Switch handoffs with explicit task states and ownership. |
| Incorrect brand rule extraction | Require human review and approval. |
| False-positive findings | Include evidence, confidence, and human review states. |
| Unsafe agent execution | Require specific approval and maintain audit logs. |
| Partial integration failures | Track each resource independently. |
| Dashboard and backend scope expansion | Prioritise the five MVP dashboard pages and core workflow. |
| Limited hackathon time | Focus on one complete, demonstrable workflow across real integrations. |

# **23\. Product Roadmap**

## **Phase 1 — Working MVP**

* Workspace creation.  
* Brand knowledge management.  
* Dashboard.  
* Switch environment.  
* Specialised agent collaboration.  
* GitHub integration.  
* Figma plugin.  
* Human approval.  
* Execution records.  
* Independent verification.

## **Phase 2 — Expanded Brand Operations**

* Canva integration.  
* More comprehensive audits.  
* Scheduled inspections.  
* Improved findings management.  
* Brand change impact analysis.  
* Expanded reporting.

## **Phase 3 — Continuous Monitoring**

* Event-driven audits.  
* More connected platforms.  
* Automated brand health reporting.  
* Advanced team permissions.  
* Custom brand rules.  
* More comprehensive change governance.

## **Phase 4 — Brand Operations Infrastructure**

* Broader platform ecosystem.  
* Organisation-wide brand governance.  
* Cross-product consistency monitoring.  
* Advanced automation policies.  
* Enterprise audit and compliance features.

# **24\. Technical Assumptions and Constraints**

1. Switch is the agent collaboration infrastructure, not the AI model or application database.  
2. The agent runtime provides reasoning and tool execution.  
3. Markpath's backend owns brand data, approvals, task records, and integration orchestration.  
4. The dashboard is mandatory.  
5. The dashboard must use the backend as its source of truth for persistent operational state.  
6. Figma REST API access and write capabilities depend on account eligibility, permissions, and documented API support.  
7. The Figma plugin provides a write-capable path for supported operations in the active file.  
8. GitHub modifications must use a controlled branch and pull request workflow.  
9. Canva integration is constrained to documented API capabilities and eligible templates.  
10. Integration credentials must never be exposed to the browser or ordinary chat messages.  
11. The system must not claim an operation succeeded until it has verified the result.  
12. All external operations must be logged and traceable.

# **25\. Final Product Definition**

**Markpath is an agentic brand operations platform that helps companies maintain brand consistency across design, development, and marketing environments.**

It combines a central web dashboard, a Switch-powered collaboration environment, and specialised AI agents to inspect brand resources, detect inconsistencies, coordinate approved corrections, and independently verify implementation.

The dashboard provides the control centre for brand knowledge, integrations, permissions, approvals, and reporting.

Switch provides the collaboration layer where human teams and AI agents coordinate everyday brand operations.

Figma, GitHub, and Canva provide the connected environments where supported inspections and changes take place.

The product's defining workflow is:

**Detect → Coordinate → Correct → Verify**

Its defining principle is simple:

**A brand guideline is only useful when the actual products, designs, and communications consistently follow it. Markpath helps close that gap.**

