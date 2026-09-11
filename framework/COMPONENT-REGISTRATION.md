# Component registration contract for DS Starter

This is the starter's shared registration guidance. The attached application's
COMPONENT-REGISTRATION.md, when present, is authoritative for its design system;
read that application contract rather than treating this file as a competing copy.
AGENT-WORKFLOW.md links here for shared registration rules. Keep rule changes here,
not duplicated across the workflow and checklists.

## Contents

- [Interaction ownership — required before registration](#interaction-ownership--required-before-registration)
- [distinguish state ownership from component boundaries](#mandatory-distinguish-state-ownership-from-component-boundaries)
- [Standard: interaction ownership and registration](#standard-interaction-ownership-and-registration)
- [state categories and preview contracts](#mandatory-state-categories-and-preview-contracts)
- [Required preview coverage](#required-preview-coverage)
- [Required specimen presentation contract](#required-specimen-presentation-contract)

## Interaction ownership — required before registration

For every component, classify each interaction as owned behavior, an internal part,
a nested registered component, or caller-owned behavior. Inspect actual imports and
renderers; visual similarity is not proof of reuse. Record this in
`anatomy.interactionOwnership` and list actual nested component IDs in `dependencies`.

- Reuse registered child renderers. A parent may compose components without owning
  their hover, focus, pressed or disabled state demonstrations.
- Show only owner-level states in the parent's Interactions sidebar. For example,
  a message may demonstrate expansion; its nested reply Button states belong in Button.
- Keep nested controls usable in Live, but do not repeat whole parent specimens
  merely to demonstrate a child's state. Reference that dependency in metadata.
- Independently interactive sections require registered component instances. Parent
  state targets must not substitute for child registration. Reuse existing controls;
  repeated instances do not require new IDs. Composition-only variants may declare
  required preview/usage context. Noninteractive internal parts remain internal.
- Distinguish variants from dependencies and from grouped layout examples. A group
  does not introduce a new button state. Do not infer states from generic conventions.
- Annotate interaction targets with `owner` equal to the owning catalog ID. If a
  target belongs to another registered component, document it there instead.
- If the parent owns no interactions but reuses registered children, show Live and
  links to child interaction owners. If neither exists, show “No interactions defined.” Do not invent
  states to populate the sidebar. Audit source behavior, not just available CSS.

Apply this on extraction, composition, variant additions and every interaction edit.
Record gaps honestly when child reuse or browser verification is incomplete.

## Mandatory: distinguish state ownership from component boundaries

For affected stateful controls, identify the owner of the value, the registered
control that renders its accessible semantics and visual treatment, and the owner
of the action/update callback. Caller-owned data can drive UI state; it does not
mean the control has no state. Supplying documented state inputs and handling
documented outputs is unchanged reuse, not permission to override child internals.

State alone does not justify a new component or variant. Reuse a suitable existing
control first. A different label/icon/value is an instance. An approved change to
the same responsibility may be a variant or API extension; an uncovered independent
responsibility may justify a component that composes existing controls. Multiple
consumers are evidence, not a registration prerequisite. Respect app-owned rules
requiring explicit approval for new variants or changes to shared child contracts.

Keep child visual state galleries with their registered owner, while allowing those
states naturally in parent Live previews and checking parent state propagation,
keyboard/disabled behavior and domain callbacks. Do not confuse transient active
interaction with a persistent pressed/toggle value.

### Contextual layout defaults

Choose the enclosing context before selecting a list/grid gap: data rows, dropdown
menus, sidebar navigation, forms/settings, independent cards and app entries may
need different relationships. Record item gap, group gap and surface inset separately
from child internal padding. Source values from the attached app, label observed
versus provisional recommendations, and never generalize a child’s internal padding
into an external layout default. Unknown contexts require an explicit parent-owned
choice and verification, not an invented universal spacing rule.

## Standard: interaction ownership and registration

An interaction unit is a region independently targetable by supported input that
performs a semantic action or has an independently triggered interaction state.
Identify units by user-facing behavior, not DOM boundaries or event-listener count.
Each unit must be implemented by a registered component instance with one control
owner. An enclosing registration does not cover independent descendant units.

Direct-interaction states apply to the owner's own control area. Supplied states
can change its presentation or arrangement without requiring a hit area; independent
descendant controls still belong to registered children. Multiple simultaneous state dimensions do
not alone imply multiple units. Noninteractive parts may render their owner's
state without separate registration. Separate ownership of the state value,
control semantics/treatment, and action handling in the contract.

Inventory units, search existing definitions/variants, reuse suitable ones unchanged,
and document uncovered responsibilities before adding definitions or changing shared
contracts. A repeated use is an instance, not a new definition. Composition-only
contracts are valid if required context is explicit and real previews inspect the
unit in that context. Neither standalone product usage nor multiple consumers is
required. Follow applicable approval rules; classification is not blanket permission
for new variants or unrelated migrations.

Validate real renderer calls, dependency metadata, owner-level state previews and
parent integration. Private per-section targets cannot replace child registration.
Examples elsewhere illustrate these requirements and do not override their scope.

## Mandatory: state categories and preview contracts

Classify a state by what it describes, separately from what causes it to change.
A component can respond to an input without being a clickable interaction unit.
A state transition does not by itself create a variant, a new component, or an
interaction pattern. Independently targetable controls still require registered
owners; reuse suitable existing controls unchanged.

### State categories

| Category | Meaning | Established examples |
| --- | --- | --- |
| Direct interaction | Interaction with the registered owner's own control area | hover, active, focus/focus-visible |
| Supplied state | A documented input whose value is supplied independently of where the update originates | expanded/collapsed, selected, checked, pressed toggle value, disabled |

Hover and active belong to the owner's control area, not a private section of a
parent. Focus belongs to the actual focusable owner; a parent does not acquire a
focus state just because a child is focused. Active means being pressed right now.
Pressed, when used for a persistent toggle (including aria-pressed), means its
on/off value and belongs to supplied state. Use explicit terminology in labels and
contracts; do not conflate active and pressed.

Supplied state may change rendering, visibility within the component, arrangement,
or availability. It does not imply a pointer hit area or a click-anywhere action.
A caller can update it from a registered child button, a separate control, page
logic or application data. Do not invent activation behavior just to demonstrate
that input. A whole-owner state describes the owner's presentation or arrangement;
it need not paint every descendant or require clicking the whole owner.

### Required registration contract

For each supported state dimension, document:

1. Category, input name, allowed values and default. Record combinations and
   constraints where multiple dimensions can coexist.
2. Rendering owner and visible/semantic result. Specify relevant accessibility
   attributes and which registered control or surface owns them.
3. Value owner. Supplied inputs are caller-controlled unless an explicit contract
   documents an internally managed value and its synchronization behavior.
4. Transition requests: registered trigger owner, supported activation, output
   callback/event and payload. A request is not an implicit mutation of the input.
   A purely presentational component may have no transition output or trigger.
5. Preview wiring: which controls are studio tooling, which are registered product
   children, and how the demo caller supplies the updated value. Reuse the public
   renderer/update interface; do not restyle children or mutate private internals.

### Standalone and composed demonstrations

A standalone component with supplied state has an external, clearly named control
in the interaction card's Live area. That studio control supplies its documented
input; it is not rendered inside the component, included in its dependencies or
counted as a product variant. Also show the supported states individually for
inspection. For example, a collapsed/expanded selector supplies `expanded` to a
standalone stack. The stack itself need not respond to clicks.

A registered composition may contain that stack plus a registered Button. Its Live
demo uses the actual child button: activation emits a transition request, the demo
caller updates the value, and the stack receives the new input. The button's hover,
active and focus galleries remain at Button; the stack's supplied states remain
at the stack. The parent demonstrates their documented connection, without
copying all child state galleries. The page may supply the same state from another
control without changing the stack contract.

Ordinary in-flow disclosure can remain a composed component: expansion naturally
moves later page content. A separate floating interactive surface follows the
separate-popup rule instead: register trigger and popup independently and document
the page-initialized coordination as an interaction pattern. Component specimens
may exercise their documented composition contract; they must not attach unrelated
page-owned patterns merely to make a trigger do something.

### Extending the vocabulary

These are the current categories, not an exhaustive list of state names. When a
new state is needed, document its meaning, owner, value source, transition and
preview before adding it. Prefer an existing category; introduce a new category
only when those distinctions cannot describe it, with an explicit rationale.
Do not infer unsupported states from CSS conventions or populate empty state lists
for presentation. Update this contract and the registration checklist together.

This section defines the required preview behavior; it does not claim every
existing studio control or component already implements it. Record implementation
gaps explicitly when registering or reviewing affected components.

## Required preview coverage

Contract classification and inspectable preview coverage are separate. A target is
not automatically an API variant. Expose registered variants plus meaningful supported
configurations affecting structure, geometry, controls, accessibility or usage constraints,
including content presence, discrete sizes and composition positions. Honor explicitly
requested configurations; do not use instance classification to omit them. Representative
content values suffice within each configuration; avoid arbitrary prop Cartesian products.
Map targets to real renderer inputs and keep Live/inspection reachable. States remain
states; unsupported configurations must not be presented as supported.

## Required specimen presentation contract

Document the attached app's gallery presentation and reuse one shared specimen-only
stylesheet/helper instead of copying inline CSS per preview. Studio overview previews
receive `gallery=1`; the adapter sets `body[data-gallery=true]`. Define concise named
configurations, consistent compartment borders/padding, centered specimens and
content-aware column counts. Preserve component dimensions, required context and
interaction instances; gallery styling must not target component internals.

Captions identify configurations, not implementation details or instructions to
authors. Put reuse/ownership/renderer notes in contracts or usage documentation.
Check both compact and wide specimens, standalone behavior and gallery rendering.

### Complete spacing inspection boundaries

A component's registered class can identify an inner control rather than its full
rendered arrangement. Declare owned outer wrappers in anatomy parts and map their
padding/gaps in anatomy spacing. The inspector expands from specimen matches to
those declared ancestors within the preview, including sibling controls. It must
not infer ownership from arbitrary gallery wrappers. Verify every supported
configuration's outer insets and inter-child gaps in Spacing mode; checking only
the primary control is insufficient. Missing declarations still need correction.

### Separate popup surfaces

Register a separately appearing interactive popup surface independently from its
trigger. Keep control states at each registered owner. The consuming page owns
visibility, positioning, dismissal and focus coordination, optionally by explicitly
initializing a reusable interaction pattern. The connected arrangement belongs in
Layouts & patterns, not a component with an expanding inspection boundary. This
rule concerns separately appearing surfaces; it does not reclassify ordinary
in-flow disclosure as a variant.

### Gallery/modal preview consistency

Use one canonical `entry.preview` for the outside card and expanded modal's main
preview. Define `previewConfigurations` to select examples from that same document;
never create a second set of main-gallery fixtures in `interactions.preview`.
The right-hand interaction card is separate. Verify each source selector resolves
once and retains the same content, columns, assets and child components in both
main views. Preserve live event handlers when isolating examples.

Component specimens must not initialize page-owned interaction patterns as part of
the component demo. Show the component and its direct children there; demonstrate
cross-surface coordination in the interaction pattern's specimen and real pages.
Native trigger states remain available without attaching an unrelated popup.
