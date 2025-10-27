- Dead Signal Detector Script
  - Static analysis + usage graph

- Offline Mode (IndexedDB)
  - Ideally, I would like that, via Strategy Pattern, with interfaces, some store could implement aswell an offline mode, where the service calls would be saved in the db to be fired when backend is available, and a pseudo backend could pretend the operations where done.
  - This should be tree shakeable. That is, that different strategies should be imported only by the lazy modules that uses them. Thats the fun part of the Strategy Pattern, the strategy is implemented in the specific place, not in the generic code
  - Also, add an ADR with the architectural choice of offering this.

- Central handler extends existing error listeners, ideally an interceptor for the HTTP requests.
  - This should take into account that not every http call should fire spinner, error modals... 
  Maybe would be a good idea to have, also with the Strategy Pattern, services that: Have Spinner, Have Error Modals, have Offline Mode, have Retrials...
  - Also, add an ADR with the architectural choice of offering this.

- CRUD components with projection for filters and projection for the form. So, ideally, if someone wants to implement a component with a grid/cards, custom form for filters, custom column/field visibility and CRUD functionality, controlled by some ROLE action or functionality flag, the code needed would be: The form for the filters, the column definitions, the form for the entity and the signals that control action availability.
  - After that is archieved, a prompt to generate this. That is, given an entity, some field restrictions... generate the needed code to have a CRUD with this route name
  - Also, add an ADR with the architectural choice of offering this. 
  - I would like an analysis with the pros and cons of the strategy

- Demo components to showcase every functionality
  - One for SSR vs non SSR. Maybe have like two pages where it can be shown, somehow, SSR or partial hydration
  - One for Offline Mode
  - One for CRUD (Done with clothes, missing the projection generic component)