# Glance

Glance is a livestock location-monitoring and geographic-boundary context.

## Language

**Tracker**:
The device associated with the monitored livestock whose position is reported.
_Avoid_: Using tracker to mean the phone or gateway.

**Prototype node**:
The single tracking node used for the first location-monitoring demonstration without a separate master/slave pair.

**Master node**:
The gateway between slave nodes and the rest of the tracking system, without its own GPS tracking role.
_Avoid_: Treating master node and tracker as interchangeable.

**Slave node**:
A tracking node whose position reports pass through a master node.

**Owner**:
The person responsible for the configured tracker.

**Polygon geofence**:
A user-defined geographic boundary represented by ordered vertices.
_Avoid_: Using circular fence as an interchangeable boundary.

**Position observation**:
A reported location of a tracker at an observation time.
_Avoid_: Treating a last-known location as proof of a current position.

**Violation episode**:
One server-recorded period beginning with a fresh outside observation, including an initial outside fix. Repeated outside observations do not create another active episode.

**Returned**:
The resolution of an active violation episode by a fresh inside observation. The tracker's boundary status is then inside; returned is an episode resolution, not a third boundary state.

**Fence changed**:
The resolution of an active episode when the owner replaces the polygon. It is not a return; the new fence is evaluated on the next accepted observation.

**Stale location**:
Last-known coordinates whose observation age or accepted receipt age reaches 15 seconds, or whose timestamps are invalid. A delayed receipt does not make old coordinates current. Staleness does not manufacture a return or a disconnection episode.

**Owner credential**:
The pre-shared authorization for reading snapshots, subscribing to live updates, and managing the owner's singleton polygon. It is not read-only and is separate from the device upload credential.
