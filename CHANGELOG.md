# Changelog
All notable changes to this project will be documented in this file.

## [15.0.0] - 2020-02-10
### Added
- Federated business process, catalogue and identity services
- Deep link functionality for eFactory product search

### Changed
- Improvements on LCPA, unshipped orders and frame contract tab visualization
- Fixed bugs on T&Cs generator and shopping cart
- Moved federation switch to a global level
- Displayed the cancellation reason in the collaboration view
- Allowed users to see the details of cancelled processes

## [14.0.0] - 2019-11-28
### Added
- Shopping car functionality
- Ability to associate products with properties of existing products
- Unshipped Order tab in dashboard
- Collaboration tab for textile UC in dashboard
- IoT-Blockchain API
- Multilinguality support for company settings
- User roles added to profile page

### Changed
- Improved transition between BPs
- Improved track-and-trace and QualiExplore functionality
- Extended and fixed analytics
- Extended and updated translations
- Moved language configurations to environment files

## [13.0.0] - 2019-10-01
### Added
- Frontend internationalization, language selection and translation to Spanish (ongoing)
- Product / service comparison
- Finish collaboration functionality
- Delete user / company capabilities
- Added flag to hide VAT tax information

### Changed
- Transformed chat window to globally available slide-in
- Added brand name and other company data to search
- Extended analytics
- Switched to new VAT rate and validation service (Cloudmersive)

## [12.0.0] - 2019-08-16
### Added
- QualiExplore Front-end component
- Configurable company-specific BP workflows
- Edit functionality for existing certificates

### Changed
- Major refactoring to Angular 7 and Webpack 4
- Reworked discount display
- Minor bugfixes regarding Terms & Conditions

## [11.0.0] - 2019-06-17
### Added
- Delegated / federated search (staging only)
- Rocket chat integration (staging only)
- Platform log analytics
- Projects page on dashboard
- Data channel negotiation
- Negotiation UI update (including negotiation history and change highlighting)
- Search UI update
- Company search
- Product search based on categories
- Selection of main product image
- Tracking and Tracing UI update
- Business process export
- Search capabilities for "Platform Members" and "Company Management"
- Terms and Condition editor
- Frame contracts
- Frontend logging
- Added VAT tax to prices

### Changed
- Redirect URL in case login is required
- Extracted default currency and main color to config
- Styling of properties and values
- Styling of facets / filters
- Enable setting / selecting specific languages for multilingual fields
- Unified country selection
- Improvements and fixes on business process workflows

## [10.0.0] - 2019-05-10
### Added
- Logistics services UI update
- Negotiation UI update
- Catalogue creation and support for multiple catalogues
- Performance analytics
- Product Favourites search
- Compare products
- Search all products from company
- Self descriptive trust fields
- Search boosting 

### Changed
- Platform member names fixed
- Disabled product id when the publish mode is edit

## [9.0.0] - 2019-03-29
### Added
- Boosting mechanisms for search results
- UBL dimension fields in product details
- "State / Province" input for addresses
- Catalogue export functionality
- Catalogue clone/copy product functionality
- Favourite product mechanisms in product details and dashboard
- Ability to cancel pending member invites
- Sorting mechanisms for company lists
- File extension checks for image uploads on the UI
- Display of correspondents in business processes

### Changed
- Improved search filter retrieval and presentation
- Improved search suggestions
- Proper join of item and party item on the UI (some fields still missing)
- Fixed storage and selection of company settings
- Improved naming conventions for ontologies
- Improved "Platform Members" page and added direct link to navbar
- Unified price display

## [8.0.0] - 2019-02-28
### Added
- Multilinguality features
- Simplified and unified product publishing page including direct value inputs
- Switch to new indexing service

### Changed
- Improved platform information page
- Adapted to identity-service updates
- Increased image upload limits to 2 MB
- Taxonomy caching for improved performance
- Added input switch for "Other" sectors

## [7.0.0] - 2019-02-04
### Added
- Default ontology configuration including separate tabs and filters in category search
- Company rejection and data change capabilities in platform management
- VAT validation and data retrieval
- Defined country selection based on fixed dataset
- Configurable Terms of Service documents
- Color code tooltip in dashboard welcome tab

### Changed
- Full price breakdown during negotiation
- Return to previously used dashboard tab after completing a business process step
- Improved category tree navigation including breadcrumbs
- Ontology-independent usage of parent categories on search landing page
- Automatic re-parsing of malformed website links

## [6.0.0] - 2018-12-21
### Added
- Platform configuration options in globals in order to allow for adjusting the UI without changing the code base
- Collaboration group management in dashboard
- Company management / verification capabilities in platform management
- User profile page
- Price / discount configurator in product management

### Changed
- Minimized dashboard summary
- Field and file size limitations fixed and indicators added to the UI
- Labels without values hidden from the view mode
- Data monitoring option emphasized in negotiation
- Tooltips and wording improved
- Browser compatibility messages added

## [5.0.0] - 2018-11-02
### Added
- Company details, ratings and trust/reputation scores for all relevant UI elements
- Rating/trust filters for text-based search
- "Action required" indicators for dashboard tabs
- "Profile completeness" indicator that is further used by the trust management to evaluate reputation of platform participants
- Cancellation option for individual business processes as well as whole collaboration
- Trust/Reputation policy configuration in platform management

### Changed
- Major extension of company registration and settings
- Fixed status display of business processes on the dashboard

## [4.0.0] - 2018-09-14
### Added
- Support of multiple delivery terms (e.g. addresses
- Definition of default negotiations settings
- Company-wide certificate management
- Favourite and recently used categories are now tracked and can be re-used when publishing products

### Changed
- Fully reworked UI design
- Clear and extended business process workflow with step-by-step guidance (including data channels and track-and-trace functionality)
- Major search and search filter improvements (pre-selection of categories, search term suggestions, filter categorization, more self-explanatory labels)
- Clear distinction between products and logistics services on publishing and executing business processes

## [3.0.0] - 2018-06-01
### Added
- Data channels
- Contract generation
- Platform management functionality (platform analytics and security dashboard)

### Changed
- Improved product / service / catalogue publishing
- Extended and improved business processes

## [2.0.0] - 2018-03-16
### Added
- Role management for users
- End-User License Agreement (EULA)
- User manuals
- Explorative search functionality
- Product Parts Approval Process (PPAP)

### Changed
- Improved company members management
- Extended company registration and settings
- Improved dashboard functionality (separate tabs for sales/purchases, direct links to business processes, improved sorting)
- Improved catalogue management (minimized visualization, added search and filter functionality)

## [1.0.0] - 2017-12-15
### Added
- Basic user and company registration
- Basic product / service / catalogue publishing
- Basic search functionality
- Basic negotiation, ordering and fulfillment processes

 ---
The project leading to this application has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 723810.
