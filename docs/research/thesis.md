# GLANCE thesis - page-preserving Markdown extraction

## Provenance and limitations

- Source: `E:/Downloads/Thesis-III-2 (2).pdf` (6,954,880 bytes).
- SHA-256: `91d3a8c9e6880cb1ec0efca7556c663f139036684ad903ce7854d8551a722bf9`.
- Extracted on 2026-10-03 using bundled Python and pypdf 6.10.0, `extract_text(extraction_mode="layout")`.
- 90 physical PDF pages; 87 contain extractable text, 3 do not (85, 89, 90). Plain extraction contains 164,353 characters including whitespace; layout extraction contains 153,078 before Markdown wrappers or trimming.
- Page references below are 1-based physical PDF pages, NOT inferred printed page numbers.
- This is the full available embedded-text extraction, not a synopsis. Text blocks preserve layout spacing and tables rather than inferring document headings, columns, or equation structure. Whitespace-only margins are trimmed; wording, errors, and inconsistent numbering are not corrected.
- Embedded images, schematics, diagrams and raster equations are not reproduced by text extraction. In particular pages 85, 89, 90 require OCR for full transcription; they are flagged rather than called blank. Selected visuals on pages 47, 48, 85, 89, 90 were inspected; annotations are explicitly reviewer notes, not extracted thesis text.
- Reading order can differ for tables, formula fractions, columns and references. Compare the original PDF for exact layout and small pin labels. Figure/table cross-reference mistakes in the PDF remain unchanged.
- No OCR engine was available in the checked environment. A missing image transcription is not evidence that a page contains no information.
- The report presents proposed methodology and empty test checklists, not demonstrated field results. See the separate review for scope decisions and concerns.

## Navigation

- Title: PDF page 1.
- Chapter 1: PDF pages 2-9.
- Chapter 2: PDF pages 10-39.
- Chapter 3: PDF pages 40-70.
- References: PDF pages 71-79.
- Appendices: PDF pages 80-90.

## PDF page 1

```text
GLANCE: GPS-Based Livestock Tracking and Geofencing System Using LoRa

                           Communication with Mobile App Visualization






                                           A Project Study Report

                                                 Presented to

                            The Faculty of the Department of Electrical and

                             Electronics and Communications Engineering

                                        Central Philippine University

                                         Jaro, Iloilo City, Philippines





                      In Partial Fulfillment of the Requirements for the Degree of

                              Bachelor of Science in Electrical Engineering



                                                       By

                                              Aguilar, Russel A.

                                             Camiña, Denielle S.

                                           Laguna, Alexa Marie C.

                                          Mesina, Paulo James R.

                                           Nuñal, Ervin Mathew V.





                                                 August 2026
```

## PDF page 2

```text
Chapter 1



                                                   Introduction



Background and Rationale

         Livestock production is an important component of the global agricultural sector,

providing food, income, and economic security to millions of people. The Food and Agriculture

Organization of the United Nations (FAO) reports that livestock supports the livelihoods of

approximately 1.3 billion people worldwide and contributes about 40% of agricultural output in

developed countries and 20% in developing countries. Livestock also provides approximately

34% of the global food protein supply, demonstrating its importance to global food security and

rural livelihoods (FAO, n.d.). As livestock production increasingly involves animals that are

allowed to graze or roam over larger areas, continuously knowing their location can become

difficult for owners. Manual monitoring requires time and physical presence, while conventional

fencing may restrict the natural movement of animals. These conditions create a need for

technologies that can allow livestock to roam while enabling owners to remotely monitor their

location and determine whether they remain within designated areas.

         In the Philippines, livestock production is also a significant part of the agricultural sector.

The Philippine Statistics Authority (PSA) reported that the country's total livestock inventory

reached approximately 18.68 million heads in 2024, consisting of 9.57 million swine, 3.82

million goats, 2.71 million carabaos, and 2.59 million cattle. Furthermore, approximately 99.3%

of the country's goat population and 84.7% of its cattle population were raised on smallhold

farms, highlighting the importance of livestock management technologies that can be

applicable to small-scale agricultural operations (PSA, 2025). In terms of economic

contribution, Philippine livestock production was valued at approximately ₱246.42 billion in

2025, representing an important component of national agricultural production (PSA, 2026).
```

## PDF page 3

```text
With livestock representing a substantial agricultural asset, improving the ability of farmers to

monitor animals and respond to location-related incidents can contribute to more efficient

livestock management.

         At the client level, the intended user requires a system that allows livestock, particularly

goats, to roam freely within a designated area rather than being continuously confined or

manually monitored. However, allowing animals to move freely also creates a monitoring

challenge because the owner may not always know their exact location or immediately

recognize when an animal has moved outside the intended area. The client's concern therefore

centers on maintaining the animals' freedom to roam while still ensuring that they remain within

a safe and predefined area. A system capable of providing the animal's current location and

notifying the owner when it crosses a designated boundary can help address this concern

without requiring continuous physical supervision.

         Several existing technologies and studies have attempted to address livestock

monitoring through GPS, wireless communication, and geofencing. Ahmad (2020) proposed an

IoT-based livestock tracking and geofencing system that established geographical safe zones

for cattle and allowed farmers to remotely monitor livestock rather than relying entirely on

physical inspection. More recently, Schulthess et al. (2024) developed a LoRa-based cattle

monitoring system for remote locations that integrated GNSS positioning with LoRaWAN

communication and a backend server. Their prototype demonstrated the feasibility of

transmitting livestock location and activity information over a long-range wireless network, with

the system operating at 511.9 J per day and achieving a battery lifetime of approximately four

months under the tested configuration. These studies demonstrate the feasibility of combining

GPS/GNSS and long-range wireless communication for livestock monitoring. However, the

proposed GLANCE system focuses specifically on a

GPS-to-LoRa-to-master-device-to-Internet-to-server-to-mobile-application architecture, with
```

## PDF page 4

```text
geofencing and mobile visualization designed around the requirements of the intended local

user.

         The proposed solution, GLANCE (GPS, LoRa, And Networked Collar Ensemble), will

be developed as a wearable livestock tracking device that acquires the animal's geographic

coordinates using GPS and transmits the location data through LoRa communication. The

LoRa receiver will be connected to a master device that serves as the communication bridge

between the local livestock tracking network and the Internet. The received data will then be

transmitted to a server for storage and processing and subsequently displayed through a

mobile application. The application will allow the user to visualize the livestock's location and

establish a user-defined geofence. When the animal's recorded coordinates indicate that it has

moved outside the designated polygonal boundary, the system will generate a geofence

notification. This approach allows the livestock to continue roaming freely while giving the

owner a means of remotely monitoring its location and responding to boundary violations.

         The technologies incorporated into GLANCE are supported by recent developments in

precision livestock monitoring and Internet-of-Things applications. GPS provides the

geographic coordinates required for location tracking, while LoRa/LoRaWAN provides a

long-range, low-power communication option suitable for agricultural and remote environments.

A 2023 study on real-time grazing-cattle monitoring demonstrated the use of LoRaWAN

sensors for transmitting GPS-based animal movement information and highlighted the

usefulness of GPS and long-range wireless sensing for livestock monitoring.

         The proposed system also has potential economic benefits for livestock owners. Rather

than relying entirely on continuous physical monitoring, GLANCE can provide remote location

information and automated geofence notifications, potentially reducing the time and effort

required to locate or check roaming animals. The system may also help reduce potential losses

associated with animals leaving their designated areas or becoming difficult to locate. However,

the actual Return on Investment (ROI) of the proposed system cannot be assumed before
```

## PDF page 5

```text
implementation. Therefore, the study will evaluate its economic potential by considering the

cost of developing and operating GLANCE in relation to potential savings associated with

reduced monitoring effort and improved livestock location management. The results can

provide a basis for determining whether the proposed system is economically practical for the

intended user.

         Overall, the proposed study addresses the need for a livestock monitoring approach

that balances free animal movement with continuous owner awareness. By integrating GPS

tracking, LoRa communication, a master gateway, Internet connectivity, server-side data

management, geofencing, and mobile application visualization, GLANCE aims to provide the

livestock owner with a practical means of monitoring roaming animals without requiring

constant physical supervision. The study will therefore focus on evaluating the system's

functionality, tracking accuracy, communication reliability, and geofence alert performance

under controlled testing conditions.



Objectives of the Study

General Objective

         This study aims to develop and test a GPS and LoRa-based tracking and geofencing

system integrated in a mobile application for livestock tracking.

Specific Objectives

Specifically, the study aims the following:

1.  Design the hardware and software architecture of a GPS‑based tracking and geofencing

    system integrated into a mobile application for livestock monitoring.

             a.   Define system components.

             b.   Establish geofence logic using user‑defined polygon vertices.

             c.   Ensure functional data flow from GPS acquisition to mobile visualization.
```

## PDF page 6

```text
2.  Construct and integrate a LoRa communication system to transmit GPS coordinates from

    the tracker to the master node.

             a.   Implement reliable long‑range wireless communication.

             b.   Validate data integrity and transmission latency.

             c.   Optimize LoRa parameters for rural agricultural environments.

3.  Develop and integrate an IoT framework to enable communication between the master

    node, home Wi‑Fi router, and mobile application.

             a.   Configure internet connectivity for remote data access.

             b.   Implement notification services for geofence breaches.

             c.   Provide user control features such as activating the tracker buzzer.

4.  Conduct controlled environment testing to evaluate system performance in terms of:

             a.   Functionality: end‑to‑end operation of GPS acquisition, LoRa transmission, and

                  mobile app alerts.

             b.   Tracking accuracy: GPS data relative to predetermined locations.

             c.   Tracking reliability: consistency of communication and alert generation under

                  varying environmental conditions.



Significance of the Study

         The findings of this study are expected to benefit the following groups:

         Livestock Farmers. This study provides livestock farmers with a practical means of

remotely monitoring the location of their animals through GPS-based tracking, LoRa

communication, and mobile application visualization. The geofencing feature can notify farmers

when livestock move beyond their designated area, allowing them to respond promptly while

still allowing the animals to roam freely within a safe boundary. The system may also provide a

remotely activated buzzer to assist farmers in locating or identifying the tracked animal when

necessary.
```

## PDF page 7

```text
Livestock Owners and Caretakers. The proposed system can reduce the need for

continuous physical monitoring by providing accessible location information through a mobile

application. By receiving location updates and geofence notifications remotely, owners and

caretakers can monitor livestock movement and determine whether animals remain within their

designated area. This may help improve convenience and efficiency in routine livestock

monitoring.

         Neighboring Farmlands and Communities. The geofencing capability can help

minimize instances of livestock entering neighboring agricultural areas by providing early

notification when an animal crosses a predefined boundary. Prompt notification may allow

livestock owners to retrieve the animal before it causes damage to crops or other properties,

potentially reducing conflicts and promoting better relationships among neighboring farmers.

         Academic and Professional Institutions. This study contributes to the field of

electrical and electronics engineering by demonstrating the integration of GPS, LoRa,

embedded systems, Internet connectivity, server-based data management, geofencing, and

mobile application visualization in a livestock monitoring application. The developed system

may serve as a reference for students, instructors, and researchers interested in wireless

communication, IoT systems, embedded technologies, and location-based applications. Future

researchers may further improve the system by exploring enhanced GPS accuracy,

energy-efficient hardware, improved geofencing algorithms, additional livestock sensors, or

more advanced data analytics.



Scope and Limitations

         The scope of this study focuses on the design, development, integration, and controlled

testing of GLANCE (GPS, LoRa, And Networked Collar Ensemble), a GPS-based livestock

tracking and geofencing system with mobile application visualization. The system will integrate

a solar-powered GPS tracking collar for acquiring the livestock’s location coordinates, LoRa
```

## PDF page 8

```text
communication for transmitting location data from the collar to a master device, and an IoT

framework for transferring the received data through an Internet connection to an online server.

The mobile application will display the livestock’s location on a map and provide notifications

when the animal moves outside a user-defined geofence. A remotely activated buzzer will also

be incorporated into the collar to assist the owner in locating the animal when necessary.

         The performance of the developed system will be evaluated through controlled testing

in terms of GPS functionality, GPS tracking accuracy, GPS tracking reliability, LoRa

communication functionality, data transmission performance, and geofencing effectiveness.

         The study will use five (5) mature goats within the vicinity of Casa Valencia, Brgy. Pulao,

Dumangas, Iloilo, covering an area of approximately 3,600 square meters consisting of open

and partially forested environments. The testing will assess the system’s ability to acquire and

transmit GPS coordinates, display livestock locations through the mobile application, and

generate notifications when the animals cross the defined geofence.

         The developed system will be limited to a maximum of five (5) livestock trackers

communicating with a single master device. The mobile application will be limited to livestock

location visualization, basic map functions such as zooming and view movement, and geofence

notifications. The system will not include livestock health monitoring, biometric identification,

activity classification, or other animal-condition measurements. Testing will be limited to mature

goats within the designated testing area at Casa Valencia, Brgy. Pulao, Dumangas, Iloilo;

therefore, the findings may not be directly applicable to other livestock species, age groups,

geographic locations, or environmental conditions.

         GPS and LoRa communication performance may also be affected by environmental

factors such as dense vegetation, physical obstructions, terrain, weather conditions, and

satellite visibility. The GPS module requires sufficient satellite visibility to obtain valid position

fixes, while LoRa communication performance may vary depending on distance, obstructions,

and environmental conditions.
```

## PDF page 9

```text
The geofencing feature will be limited to a polygon-based ray-casting algorithm for

determining whether the reported GPS coordinates are within or outside the user-defined

boundary. The study will not compare the selected algorithm with other geofencing methods.

         The wearable collar will be solar-powered, making its operation dependent on available

sunlight. Its power performance may therefore vary depending on sunlight exposure, weather

conditions, shading, and the power requirements of the GPS, LoRa, buzzer, and other

electronic components. The mobile application will also require an available Internet connection

to access and display the location data transmitted through the server.
```

## PDF page 10

```text
Chapter 2



                                        Review of Related Literature



              Recent advancements in wireless communication technologies continue to provide

new opportunities for improving agricultural practices. Livestock farming, in particular, remains

constrained by challenges such as animal loss, theft, and the difficulty of maintaining consistent

oversight of roaming animals, particularly within extensive or semi-open grazing systems where

manual monitoring is impractical. Developments in precision livestock farming and the Internet

of Things have increasingly addressed these challenges through automated, sensor-based

monitoring, enabling farmers to determine animal location, health, and behavior with minimal

direct intervention.

               Among the technologies currently available, the Global Positioning System (GPS)

remains the predominant method for acquiring livestock location data due to its global

coverage and independence from local infrastructure, while Long Range (LoRa)

communication has emerged as a leading option for long-range, low-power data transmission

in rural and off-grid environments. The integration of these two technologies has already been

demonstrated to be technically feasible, with existing systems successfully combining satellite

positioning with long-range wireless transmission to support remote livestock monitoring.

However, existing literature also indicates that while GPS and LoRa have each been

extensively validated in isolation, current implementations continue to face limitations in

scalability, interoperability, and system-level integration, particularly when multiple

communication nodes are deployed concurrently or when tracking systems must be extended

into complete, user-facing applications. These findings point to the need for a unified

framework that combines long-range monitoring with accessible, low-cost identification and

visualization capabilities — a gap that the present study aims to address.
```

## PDF page 11

```text
GPS Technology in Agriculture

         GPS has become notably widespread in the year 2026 from its emergence in the

1990’s. In today’s world, every smartphone has an embedded GPS which enables the use of

maps, shared location for social or safety purposes, and track fitness activities. Beyond

personal use, however, GPS has seen usage in aviation and shipping, infrastructure of critical

systems such as power grids, telecommunication networks, and financial services like ATMs

and stock markets, where it serves as a vital high-precision timing standard.

         Technically, GPS is a satellite-based radionavigation system that operates through

trilateration, requiring signals from at least four satellites to determine a unique 3D position.

Furthermore, GPS technology is extensively applied in geodesy and surveying, providing the

high-accuracy control necessary for mobile mapping and various civil engineering applications.

It also plays a significant role in environmental conservation and public safety, where it is used

to track endangered species, monitor atmospheric activity, and assist in disaster management.

         Most recently, the agricultural sector has seen a surge in GPS usage through precision

livestock farming (PLF). In this context, GPS-enabled wearable collars allow for the real-time

monitoring of animal movement and behavior, providing farmers with insights into grazing

patterns, site use preferences, and overall herd health. These advancements have also

enabled the development of virtual fencing, where GPS technology is used to manage livestock

distribution without the need for physical barriers. In PLF, GPS is primarily utilized for the

automated monitoring of livestock distribution and activity patterns across diverse landscapes.

It allows researchers and farmers to (1) identify Site Use Preferences wherein GPS data

reveals how cattle utilize different areas of a pasture, helping to identify "grazing hotspots" and

resting sites; (2) Resource Management, mapping animal movements, farmers can

strategically place water troughs, shade, and supplemental feed to encourage a more even

distribution of the herd, thereby reducing environmental degradation and overgrazing; (3)

Virtual Fencing where GPS locators are integrated with devices that deliver acoustic warnings
```

## PDF page 12

```text
or mild electric stimuli to keep animals within defined virtual boundaries, eliminating the need

for physical fences; (4) Health and Safety Monitoring: GPS collars are used to detect specific

events such as calving, predator attacks, or signs of illness.

         The advantage of GPS-based systems is the ability for (1) continuous and non-invasive

monitoring; (2) data tracking to optimize grazing management, enhancing agroecosystem

productivity while identifying areas sensitive to soil nutrient build-up; (3) context-aware

management where GPS can be combined with other bio-loggers (e.g., accelerometers) to

provide a comprehensive view of animal well-being, distinguishing between grazing,

ruminating, and resting activities; (4) abundance of open-source designs which has made GPS

tracking more accessible for researchers and farmers with limited budgets.

         While GPS is incredibly useful primarily due to its global range, GPS is also limited in

some areas regarding signal vulnerability to dense vegetation, buildings, or rugged topography

which leads to poor fixes in deep woods or the “urban canyon” effect which is defined as the

multipath interference which can confuse GPS receivers and create 30 meters or more of error

(Tripela, 2025); Additionally, other limitations include the high energy consumption of GPS

which limits battery life to hours of operation only unless the design makes use of bulky

batteries, precision and sampling errors which as been perceived to significantly underestimate

the total daily distance traveled by livestock (McGranahan et al., 2018), and lastly, operational

costs to equip and sustain the use of commercial GPS collars still remains a significant

economic barrier for many farmers (McGranahan et al., 2018; Rivero et al., 2021; Lamanna et

al., 2025).



GPS Geofencing Methods

         Several studies have investigated GPS-based geofencing systems for monitoring

movement and enforcing boundaries. In order to track the real-time location of vehicles, Abbas

et al. (2019) created a GPS-based location monitoring system with geofencing capabilities that
```

## PDF page 13

```text
combines GPS technology with a microcontroller-based monitoring platform. Using GPS on

coordinates, the system creates a virtual boundary and automatically sends out alerts

whenever the vehicle under observation enters or leaves the specified area. The effectiveness

of GPS-based geofencing for real-time monitoring applications was confirmed by experimental

results, which showed that the suggested system achieved about 95% location accuracy. The

study also showed that, without requiring substantial physical infrastructure, GPS technology

offers an effective and affordable way to monitor moving objects over wide outdoor areas.

         Similarly, Meral and Güzel (2016) proposed a real-time geolocation tracking and

geofencing system using GPS and GPRS technologies integrated with an Arduino platform

through the SIM908 module. The system uses cellular communication to continuously obtain

GPS coordinates and send location data to a remote monitoring application. By comparing the

obtained GPS coordinates with predetermined geographic boundaries, a virtual boundary is

created that enables the system to instantly alert users whenever the tracked object departs

the permitted area. The study showed that GPS integration with wireless communication

technologies maintains a relatively simple hardware implementation while enabling dependable

real-time monitoring.

         A related study by Devi et al. (2019) developed a GPS tracking system based on setting

waypoints using geo-fencing, which introduced waypoint-based virtual boundaries to improve

monitoring accuracy. The researchers defined several GPS waypoints to represent the allowed

travel area rather than just using circular geofences, which allowed for more flexible boundary

creation for practical applications. Their results demonstrated that waypoint-based geofencing

provided precise tracking information for mobile objects while successfully detecting boundary

violations. Compared to fixed-radius boundaries, the study highlighted that defining geofences

using multiple coordinate points provides more flexibility for irregular monitoring areas.

         These studies demonstrate that GPS-based geofencing has become a reliable method

for monitoring the movement of mobile objects through continuous coordinate acquisition and
```

## PDF page 14

```text
boundary evaluation. The current study expands these ideas to livestock monitoring, whereas

the current systems mainly concentrate on vehicle monitoring and frequently use cellular

communication, such as GPRS, to transmit location information. In particular, GPS is used to

track livestock in real time, and LoRa is used as a communication medium to send GPS

coordinates over long distances while using less power..

         One of the most straightforward approaches of geofencing is circular geofencing, which

employs the haversine formula to calculate the great-circle distance between a user's location

and a center point on a sphere. This method is widely considered the easiest to implement and

is computationally lighter than polygonal alternatives, making it the optimal shape when dealing

with a single beacon.

         For more complex boundaries, polygonal geofencing algorithms such as Ray Casting

are used; this method determines inclusion by projecting an infinite ray and counting how many

polygon edges it intersects. If the ray crosses an odd number of edges, the point is classified

as inside the polygon. Ray casting is particularly robust because it lacks an initialization step,

meaning boundary changes between time steps do not negatively impact the results or

execution. A more accurate alternative for non-simple or arbitrary polygons is the winding

number algorithm, which calculates the number of times a polygon wraps around a point of

interest. Under this logic, a point is considered inside only if the winding number is non-zero.

Another approach is Triangle Weight Characterization (TWC), which involves an initialization

step to subdivide polygons into y-monotone polygons and then into triangles. During the

run-time step, the algorithm simply checks if the position of interest is within any of these

triangles. While TWC and "Fast Ray Casting" (Ray Casting without proximity checks) are both

efficient choices for violation detection, TWC requires re-initialization whenever boundaries

change, whereas Ray Casting does not. Overall, while polygonal methods support diverse

shapes, they require much heavier calculations, making circular fencing the preferred choice

for speed and simplicity.
```

## PDF page 15

```text
LoRa Communication System

         According to Enock et al. (2025), cellular technologies such as 3G or 4G can provide

the appropriate range for agricultural usage, but they consume too much power. LoRa is hailed

as the most suitable solution for smart agriculture due to long-range transmission paired with

low-cost implementation and low power consumption. Chitrakar et al. (2021) also mentioned

that LoRa was preferred over other radio frequency (RF) communication technologies, which

are Wi-Fi, Bluetooth, and mobile internet, because it provides long-range wireless coverage

while requiring only a relatively low bandwidth for data transmission. These characteristics

make LoRa suitable for applications that require reliable long-distance communication with

minimal power consumption. In the context of the present study, these advantages make LoRa

an appropriate communication technology for transmitting GPS coordinates from the livestock

tracker to the master device.

         The study of Chitrakar et al. (2021) entitled GPS and LoRa Module Based Safety Alert

System demonstrated how GPS coordinates were acquired through a GPS module, processed

by a microcontroller, and transmitted over long distances using LoRa technology. The

transmitted location data were then received by another LoRa module, processed by a

receiver-side microprocessor, and forwarded to a server to monitor the user's location and

generate emergency alerts when necessary. While their system focused on personal safety

and emergency notification, the present study adapts the same GPS-to-LoRa communication

architecture for livestock tracking and geofence monitoring.
```

## PDF page 16

```text
Figure 1

LoRa Data Transmission



Queueing and Collision Handling

         A primary limitation of conventional Long Range (LoRa) communication systems is their

dependence on standard ALOHA-based Medium Access Control (MAC) protocols. Although

ALOHA protocols permit remote end-devices to transmit data without prior synchronization,

they experience significant reductions in network throughput and packet delivery ratios when

multiple nodes transmit simultaneously. In scenarios involving high-density sensor deployments

or long-distance telemetry, concurrent broadcasts frequently result in radio frequency channel

contention, increased signal collisions, and considerable data loss.

         To address channel contention and increase network capacity without reducing

operational range, recent research has focused on integrating Distributed Queueing (DQ)

mechanisms into the LoRa MAC layer. Wu et al. (2021), in the EURASIP Journal on Advances

in Signal Processing, demonstrated that substituting conventional uncoordinated ALOHA
```

## PDF page 17

```text
access with a distributed queueing framework significantly reduces packet collisions during

high-density node transmissions. In a distributed queueing architecture, channel access is

divided into separate contention and data transmission phases, managed by parallel logical

queues: a Collision Resolution Queue (CRQ) and a Data Transmission Queue (DTQ). When

remote nodes initiate access requests, the central master or gateway node processes these

requests concurrently, resolves collisions, and assigns dynamic queue positions or time slots to

individual device IDs. As a result, end-nodes transmit coordinate or payload data sequentially

according to their assigned queue slots, thereby eliminating payload-level collisions.

Additionally, by combining distributed queueing with full-duplex control mechanisms, Wu et al.

(2021) reported up to a 1.83-fold improvement in stable network throughput over long

distances. These results indicate that dynamic request-acknowledgment handshakes and

master-managed queuing protocols are critical for maintaining stable data throughput,

minimizing channel contention overhead, and ensuring reliable multi-node performance in

low-power, long-range tracking systems.



Energy Conservation Methods

         To address the high power consumption of GPS, the sources suggest that the most

significant energy savings are achieved by moving beyond basic periodic duty-cycling (PDC)

toward context-aware management of position uncertainty. A premier method for this is the use

of dynamic Absolute Acceptable Uncertainty (AAU), which adjusts the maximum tolerable

position error based on the application's current state. In specialized contexts like virtual

fencing, dynamic AAU allows for significantly higher uncertainty when a subject is far from a

boundary, which can reduce GPS power consumption by more than 70% compared to fixed

uncertainty bounds.

         This uncertainty-based approach is often implemented within a Rate-Adaptive

Positioning System (RAPS), which leverages a user's space-time history and estimated
```

## PDF page 18

```text
velocity to trigger GPS fixes only when the estimated uncertainty is about to exceed the

specified AAU. While adding hardware can seem to add complexity, the sources demonstrate

that a duty-cycled accelerometer (drawing just 0.01 Watt) provides a highly practical means of

motion inference, which can extend a device's lifetime by more than 3.8 times. These individual

savings are further augmented by cooperative localization, where nearby devices share

position data via low-power radios like Bluetooth or IEEE 802.15.4 to distribute the "GPS load"

among neighbors. Such cooperation is optimized via event-based beaconing and GPS lock

back-offs, which prevent redundant, simultaneous fix attempts that would otherwise waste

battery.

         Finally, supplemental algorithmic refinements such as celltower-RSS blacklisting

prevent energy waste by remembering locations, like indoors or underground, where GPS fixes

historically fail. The energy spent during each necessary fix is also minimized by optimizing

target accuracy (Ptarget); turning off the GPS module once it reaches a sufficient precision (e.g.,

10–13m) rather than its maximum (5m) can save up to 70% of energy per activation. While

substitutes like WiFi-based positioning (WPS) can obtain fixes faster at nearly half the power of

GPS, the flexible application of dynamic AAU remains a key driver for balancing high-precision

requirements with extreme energy efficiency.



Geofence Detection Logic

         Kouskoulas et al. (2021) presented a formally verified geofencing algorithm designed to

prevent autonomous mobile platforms from leaving a designated operating region. The study

focused on keep-in geofencing, wherein the system determines whether the moving platform

remains within a predefined geographic boundary. The proposed algorithm uses a dynamic

model of the platform's movement to predict potential geofence violations and determine safe

actions that maintain the platform within the permitted area. The researchers incorporated

uncertainty in the system's model parameters and implemented the algorithm with extensions
```

## PDF page 19

```text
for nondeterministic conditions. The approach was subsequently flight-tested on an

autonomous aircraft, demonstrating the application of formally verified geofence logic in a

real-world autonomous system.

         The concept of keep-in geofencing is directly applicable to the proposed GLANCE

(GPS, LoRa, And Networked Collar Ensemble) system. Similar to the approach of Kouskoulas

et al. (2021), the present study defines a geographic region within which the monitored subject

is expected to remain. However, instead of predicting the trajectory of an autonomous aircraft,

GLANCE uses GPS coordinates obtained from livestock trackers and determines whether the

animal's current position is inside or outside the predefined geofence. The current GLANCE

design implements this determination using a ray-casting algorithm, in which the system

evaluates the number of intersections between a test ray and the geofence boundaries to

classify a position as inside or outside the defined polygon.

         The geofence detection process of the proposed system begins when GPS coordinates

are acquired by the livestock tracker and transmitted through the LoRa communication network

to the master device. The master device then evaluates the received latitude and longitude

against the predefined geofence using the ray-casting algorithm. If the coordinates are

determined to be within the polygon, the livestock is classified as remaining inside the

designated area and monitoring continues. Conversely, when the calculated position falls

outside the predefined boundary, the system identifies a geofence violation and generates an

alert for the user. This adaptation demonstrates how the geofencing principle presented by

Kouskoulas et al. (2021) can be applied to livestock monitoring, where the primary objective is

not autonomous trajectory correction but the reliable detection and notification of livestock

boundary violations.
```

## PDF page 20

```text
Alert Trigger Condition

         Alsaqer et al. (2015) investigated the performance of geo-triggering in small geofenced

areas, focusing on the accuracy, reliability, and battery consumption of different

location-tracking profiles. The authors described geo-triggering as a mechanism capable of

initiating location-based actions when a user enters, exits, or remains within a predefined

geofenced area. The study evaluated Fine and Adaptive tracking profiles in small outdoor

geofences and found that the Adaptive profile achieved 100% reliability while providing an

average positional accuracy of 68.53 meters for geofences with radii ranging from 20 to 70

meters. The Adaptive profile also reduced battery consumption by 15.20% when the device

was stationary and by 9.23% when it was moving. These results demonstrate that the reliability

of a geofence-triggered alert depends not only on the boundary condition itself but also on the

accuracy and tracking behavior of the positioning system.

         The findings of Alsaqer et al. (2015) are relevant to the proposed GLANCE system

because its alert mechanism is similarly dependent on determining the livestock's position

relative to a predefined geofence. In the proposed system, GPS coordinates acquired by the

livestock tracker are transmitted through the LoRa network to the master device, where the

coordinates are evaluated using the implemented geofence detection algorithm. When the

livestock position is determined to be outside the predefined boundary, the system classifies

the condition as a geofence violation and triggers an alert for the user. This trigger condition will

serve as the basis for activating the proposed audio beacon and mobile application notification,

allowing the farmer to receive an immediate warning when livestock leaves the designated

monitoring area. Similar to Alsaqer et al. (2015), the GLANCE system must consider

positioning accuracy and reliability when determining whether an alert should be generated,

since inaccurate GPS measurements may result in premature or missed boundary-violation

alerts. Therefore, the present study will evaluate the reliability of its alert-triggering mechanism

together with the accuracy of geofence detection during field testing.
```

## PDF page 21

```text
User Alert Mechanism

         Jayapradha et al. (2024) developed a geo-fencing approach for a location-based alert

system that utilizes GPS to provide users with location-aware, just-in-time notifications. The

study aimed to develop a GPS-based application capable of generating an alarm when a user

arrives at a predetermined location. The system allows a desired location to be established and

uses the user's position to determine when the predefined location is reached, at which point

an alarm is activated to notify the user. The authors demonstrated the application of geofencing

as a mechanism for delivering timely location-based alerts, particularly for users who need to

be reminded when approaching or arriving at a specific destination.

         The approach presented by Jayapradha et al. (2024) is relevant to the proposed

GLANCE (GPS, LoRa, And Networked Collar Ensemble) system because both systems use

geographic location as the basis for triggering user notifications. However, while the previous

study activates an alarm when a user arrives at a predetermined location, GLANCE is

designed to notify the farmer when livestock moves outside a predefined monitoring boundary.

In the proposed system, GPS coordinates acquired by the livestock tracker are transmitted

through the LoRa communication network to the master device, where the coordinates are

evaluated against the predefined geofence. When a boundary violation is confirmed, the

system generates an alert for the user.

         For the proposed GLANCE mobile application, this user-alert mechanism will be

adapted into a visual notification interface that communicates the occurrence of a geofence

violation to the farmer. The alert may present relevant information such as the livestock

identification, violation status, location, and time of detection, allowing the farmer to quickly

determine which animal requires attention. This extends the location-based alert concept of

Jayapradha et al. (2024) from a simple alarm notification into a livestock monitoring interface

where the alert provides actionable information to the user. The integration of the user alert

mechanism with the GPS-based geofence detection and LoRa communication of GLANCE is
```

## PDF page 22

```text
therefore intended to provide timely notification and support faster response to livestock

boundary violations.



Auditory Warning Signals for Alert Systems

         Haas and Casali (2017) investigated the perceived urgency and response time

associated with different auditory warning signals under broadband-noise conditions. The study

evaluated sequential, simultaneous, and frequency-modulated pulse formats, as well as

different pulse levels and inter-pulse intervals. The results indicated that increased pulse level

increased the perceived urgency of the warning signal and reduced response time. Similarly,

shorter inter-pulse intervals were associated with greater perceived urgency, while sequential

signals required longer detection times and were perceived as less urgent than the other signal

types. These findings demonstrate that the effectiveness of an auditory warning depends not

only on the presence of sound but also on its temporal characteristics and signal pattern.

         These findings are relevant to the proposed GLANCE system, which generates an alert

when the GPS-based geofencing subsystem determines that livestock has moved outside the

predefined monitoring boundary. In the present study, a 2.5-kHz audio beacon will be

incorporated into the livestock tracker as an initial prototype frequency to provide a local

audible warning during a verified geofence violation. The audio beacon will utilize an

intermittent pulse pattern rather than continuous activation, guided by the findings of Haas and

Casali (2017) regarding the influence of pulse timing and signal characteristics on perceived

warning urgency. However, because the study by Haas and Casali focused on human auditory

warning responses rather than livestock, the suitability of the 2.5-kHz frequency for the

proposed GLANCE tracker will be evaluated experimentally based on audibility, power

consumption, and livestock response.
```

## PDF page 23

```text
Enclosure Weight

         When it comes to attaching tags and collar-based trackers to animals, the principle of

determining the permissible mass of the tracker based on its relation to the mass of the animal

is as follows: it should not be more than 3% to 5% of the total mass of the animal (Wilson et al.,

2021). Taking into account the body mass of an adult goat ranging from 40 kg to 80 kg, the

mass of the collar should range from 1.2 kg to 2.4 kg. Nevertheless, new studies of

biomechanics claim that the rule of static load is not sufficient since the dynamic forces during

locomotion (jumping, running, and head shaking) should also be taken into consideration, and

the target weight should be less, ranging from 1.6% to 2.98%.

         When discussing the application of precision livestock farming (PLF) in commerce,

contemporary electronic collars used in ruminants function under the theoretically calculated

maximum mass limits (Lamanna et al., 2025). Modern collars fitted with accelerometers, GPS

and telemetry systems usually range from 80 g to 500 g in weight. In the case of small

ruminants such as goats, the ultra-light hardware configurations used in agriculture research

and studies usually have weights of under 0.5%-1% of the body weight of the animal (Lamanna

et al., 2025). The reason behind this is that the weight of the collars should be kept within this

minimum limit in order not to influence the behavior of the animal.

         In addition to absolute weight constraints, considerations related to collar size, fit, and

prolonged use are vital in ensuring that there will be no harm in the animal’s welfare

(Schoenecker et al., 2024). Research on the prolonged use of telemetry collars on

medium-to-large herbivores shows that the effects on body condition, foraging, and overall

survival from such collars are minimal if proper adjustments are made and if the weight and fit

of the collar are not causing any harm to the animal (Schoenecker et al., 2024). The

importance of keeping the collar light and using the break-away mechanism or right-sizing it is

crucial for goats since goats climb a lot.
```

## PDF page 24

```text
Lithium-Based Batteries

         The Internet of Things (IoT) has ushered in an era of unparalleled connectivity,

transforming diverse sectors from healthcare to industrial automation (Hasan et al., 2023).

Because these systems require real-time functionality and remote deployment, batteries act as

the essential "fuel" for these technological "engines” (Hasan et al., 2023). While lithium-ion

batteries are often considered the default choice, Hasan et al. (2023) emphasize that a

"one-size-fits-all" approach is insufficient because different IoT environments, such as a

compact smartwatch versus a large industrial sensor, have unique energy requirements.

Consequently, researchers must evaluate various technologies including lead-acid,

nickel-metal hydride (NiMH), lithium-based chemistries, solid-state, alkaline, zinc-air, and redox

flow batteries to determine their compatibility with specific applications.

         The evaluation of these technologies is primarily based on parameters such as energy

density, longevity, safety, and cost. For applications requiring high energy density, zinc-air

batteries stand out with the highest gravimetric specific energy of approximately 500 Wh/kg,

though they suffer from a short cycle life. In contrast, traditional lead-acid batteries offer a low

energy density of around 40 Wh/kg but remain relevant for their cost-effectiveness and

reliability in industrial settings. For systems requiring deep discharge capacity, redox flow

batteries are ideal because they can undergo full discharge cycles without significant

degradation, making them suitable for long-duration, uninterrupted power in remote sensor

networks. However, their complexity and the need for external electrolyte tanks make them

difficult to miniaturize for compact devices (Hasan et al., 2023).

         Lithium-ion (Li-ion) and lithium-polymer (LiPo) batteries currently provide the most

balanced performance for modern IoT needs, offering a high gravimetric energy density of

around 180–200 Wh/kg and excellent energy efficiency. Lithium iron phosphate (LiFePO 4 ), a

subcategory of Li-ion, is particularly noted for its high cycle life and thermal stability, making it

one of the safest lithium chemistries available. Emerging solid-state batteries are highlighted
```

## PDF page 25

```text
for their potential to overcome the volatility of liquid electrolytes, offering even higher energy

densities and improved safety. Meanwhile, alkaline batteries remain preferred for low-drain,

consumer-facing IoT devices due to their low cost, standardized sizes, and extremely low

self-discharge rates (Hasan et al., 2023).



GPS Antenna Placement

         The performance and accuracy of positioning by the use of Global Navigation Satellite

Systems (GNSS) and Global Positioning System (GPS) trackers depend on the presence and

availability of signals and their line of sight. As regards the design of the telemetry collars for

use with small ruminants such as goats, the ideal position of the GPS antenna is at the top of

the animal’s neck directed towards the sky. The tracker, located so as to have an antenna

facing upwards and towards the sky, ensures satellite visibility and increases the Fix Success

Rate (FSR) while decreasing location error (Siguín et al., 2021).

         Small ruminants being active in their grazing behaviors and moving their heads, the

positioning of an antenna towards the top of the neck calls for particular designs. Telemetry

devices used for wildlife and domesticated animals are designed to allow the antenna to be

always positioned towards the sky through a counterweight system where a weighted

electronics or battery part is positioned at the bottom (ventral part) of the neck. The

gravitational force acting on this weighted part helps to keep the upper antenna always pointed

towards the sky (dorsal side) (Siguín et al., 2021).



LoRa Antenna Placement

         The placement of the LoRa communication device is an important consideration in

livestock monitoring systems because it influences signal transmission reliability and

line-of-sight communication. Proper positioning of the communication module helps minimize
```

## PDF page 26

```text
signal obstruction caused by the animal's body and surrounding environment, thereby

improving wireless data transmission performance.

         Perea et al. (2025) developed a LoRaWAN-based wireless sensor system to classify

the behavior of beef cows grazing in desert rangelands. In their study, the collar tag containing

the LoRa communication device was mounted on the top of the cow's neck to maximize data

transmission capabilities. The researchers also strategically deployed LoRaWAN receiving

stations on elevated terrain and mobile trailers to improve network coverage, maintain

line-of-sight communication, and enhance sensor data transmission. Similarly, the proposed

GLANCE system will position the LoRa antenna on the upper portion of the goat's collar to

minimize signal obstruction and support reliable transmission of GPS coordinates during

livestock monitoring.



Integration of GPS and LoRa Systems

         GPS receivers give exact spatio-temporal locations but lack any communication

channels, thus necessitating another way to deliver the information. While cellular systems

such as GSM and 5G are quite expensive and consume much energy, LoRa uses Chirp

Spread Spectrum (CSS) to transfer geographic coordinates that are highly compressed in

order to travel long distances (from 1 km to 40 km) without the need for the use of cellular and

internet systems. Using GPS as a sensor and LoRa as a telemetry makes it possible to

establish an independent and economical tracking system without any additional devices. In

the proposed design, GPS chips and LoRa transmitters would ensure constant delivery of the

coordinates from remote pastures to the central point of control without paying any monthly fee

for the cellular network (Rosmiati et al., 2018; Soy, 2023; Wijeratne et al., 2024).

         Chitrakar et al. (2021) developed a GPS- and LoRa-based safety alert system in which

a GPS module was integrated with a LoRa communication module to transmit location

information wirelessly. The system utilized a GPS receiver to acquire latitude and longitude
```

## PDF page 27

```text
coordinates, while the LoRa module transmitted the data to a receiver for processing and

monitoring. The researchers demonstrated that the integrated system successfully transmitted

location data over distances of up to 2 km, which increased to approximately 5 km by

increasing the transmitter's height, highlighting the effectiveness of combining GPS and LoRa

for long-range location monitoring. Similarly, the proposed GLANCE system will integrate a

GPS module for acquiring the real-time location of livestock and a LoRa module for transmitting

the collected coordinates to the monitoring device, enabling reliable livestock tracking in remote

grazing areas.



Functionality Testing for LoRa

          Assessing the operational performance of GPS/LoRa tracking devices in agricultural

environments necessitates comprehensive field testing across varied terrains. Jaikaeo et al.

(2022) performed extensive field trials of a low-cost GPS/LoRa livestock tracking prototype

across multiple active farm sites in Thailand and Vietnam. Their testing methodology focused

on evaluating critical system performance metrics such as positional accuracy, transmission

latency, battery longevity, and link reliability — under diverse environmental conditions through

three primary testing procedures: signal acceptance and pairing verification, environmental

packet delivery logging, and multi-node concurrent packet processing. First, initial signal

acceptance and pairing verification confirmed the master device’s capability to detect incoming

radio payloads, decode individual device IDs, and establish reliable handshake connections

with remote tracking nodes within minimal response latency limits. Regarding overall energy

performance, the wearable units achieved an average continuous operational runtime of 20

days on battery power at optimized sampling intervals.

         Second, conducting LoRa packet delivery and environmental range logging across

distance intervals demonstrated that while the units provided near-real-time spatial tracking

data effective for monitoring livestock distribution and grazing behavior, signal propagation was
```

## PDF page 28

```text
significantly affected by local topography, physical barriers, and canopy density. This resulted in

noticeable signal attenuation and packet loss in rugged or densely vegetated test areas. To

address high-density livestock scenarios where radio contention occurs, the researchers

subjected the network to multi-node concurrent packet delivery testing. By testing

methodologies by Khonrang et al. (2026) similarly demonstrated that structured queueing

algorithms enable receiver gateways to achieve a Packet Delivery Ratio of 95% or higher even

under heavy multi-node traffic. These studies underscore the necessity of conducting

multi-node concurrent packet delivery tests to guarantee that master devices can process

incoming signals, execute queueing algorithms, and record location data for multiple tracking

collars simultaneously.



Hardware-to-Application Communication Design

         Several studies have explored the integration of GPS, LoRa communication, and

mobile or web-based visualization for livestock monitoring, each contributing design insights

relevant to hardware-application communication. Germani et al. (2019) developed a complete

hardware and software architecture for continuous livestock monitoring using LoRa LPWAN,

addressing the lack of a listen-before-talk mechanism in standard LoRaWAN by proposing a

custom medium access control layer based on carrier-sense multiple access with collision

avoidance, paired with web services for data storage, analysis, and visualization. Similarly, a

smart livestock tracking system referred to as SmartSheep was designed around a wearable

device equipped with inertial sensors, a GPS receiver, and a LoRaWAN transceiver, with

hardware and firmware co-designed to minimize energy consumption; the study also

documented the full communication flow from device to LoRaWAN gateway to back-end

system, and validated the design through field testing in Italy that measured packet delivery

ratio, energy consumption, localization accuracy, and transmission delay (Rovai et al., 2021).
```

## PDF page 29

```text
In a related implementation, a real-time cattle geolocation system was built using LoRa

to transmit position data and enforce a virtual perimeter, generating alerts through a mobile

application or email whenever a tracked animal exited the established boundary, supported by

an integrated IoT platform, mobile application, and web server for data visualization

(Vargas-Salazar et al., 2022). More recently, the AgroTrack framework equipped livestock

collars with GPS, motion, and temperature sensors that transmit data via LoRa to gateways,

which then relay information to a cloud platform for visualization, alert generation, and

predictive analytics, while also situating LoRa's advantages against earlier GSM-, RFID-, and

Wi-Fi-based livestock tracking approaches (Mohapatra, 2025). Lastly, a cyber-resilient tracking

and geofencing framework described a three-tier architecture in which each livestock device

combines a GPS module, a processing unit such as an ESP32 or Raspberry Pi Zero, and a

wireless transceiver, with a gateway aggregating location and signal-strength data before

forwarding it to a cloud server that performs anomaly detection and serves a farmer-facing

dashboard (Islam et al., 2023). Collectively, these studies establish a recurring

hardware-to-application communication pattern — sensor node, LoRa transceiver, gateway,

backend server, and mobile or web dashboard that provides a strong architectural basis for the

design of the proposed system.



Solar-Powered Livestock Tracking Devices

         A substantial body of research has investigated solar power as a self-sustaining energy

source    for  livestock    tracking    devices,    addressing      device    design,    power    electronics,    and

field-level   performance.      Scheepers       et   al. (2017)     developed      the  AnTrack,      a  low-power,

cost-effective tracker powered by a flexible, watertight solar panel that records animal location

at 15-minute     intervals and transmits data to         a base station upon entering radio range; power

consumption      analysis    showed     the   device   could    remain    operational    for  a  full week    without

sunshine, establishing       the  feasibility of solar power for collar-type trackers in outdoor grazing
```

## PDF page 30

```text
environments. Risteska-Stojkoska et al. (2018) extended this design into a real-time Internet of

Things architecture for wireless livestock tracking, employing a hierarchical three-block model

in which    the   AnTrack     collar  served    as   the  self-sustainable     wearable     node;    their  analysis

likewise   confirmed a week-long         operational    buffer without sunlight,      positioning solar-powered

collars as a viable component of real-time IoT-based tracking systems.

         Complementing        these    device-level     implementations,       several    studies   examined      the

power electronics needed to manage solar energy under variable field conditions. Namoshe et

al. (2017)   developed a      hybrid power module for a livestock tracking and identification system

that combined      a lithium-ion   battery, a    nickel-metal hydride      battery, and a solar cell through a

switching block; MATLAB-Simulink simulations showed that while each source alone provided

limited  energy,    the  hybrid   configuration    generated     sufficient power     for continuous      operation,

though    prolonged     use   remained     constrained     by   battery   limitations   and   climatic   conditions.

Zhang    et  al.  (2026)    addressed     the   power-conditioning       challenges     of  solar-powered      smart

collars  by  designing     an  ultra-low-power      buck   converter    governed     by a   fast  integral  terminal

sliding mode controller with a fixed-time observer, accommodating rapid irradiance drops of up

to 40%     and   load   swings    from   28.8   microwatts     in sleep   mode     to  4 milliwatts   during   LoRa

transmission    bursts; with a sleep-mode quiescent current of roughly 9 microamps, the design

eliminated    the  need    for  manual     recharging     across    multi-season     deployments.      Babu     et al.

(2024) demonstrated the first GPS application powered by flexible perovskite solar modules on

a  bison-monitoring      collar,  where     the   modules     generated     400    mW    against    an   electronics

consumption of only        1.9  mWh,    and   retained over 30%        power conversion efficiency after 350

days   of  outdoor    testing,   confirming    that  lightweight    solar   harvesting    can   sustain   long-term

tracking collars.

         Field  evaluations further validated the practical performance of solar-powered tracking

devices relative to conventional alternatives. Mendes et al. (2025) assessed the GPS precision

and data acquisition efficiency of commercial solar-powered ear tags and collars on beef cattle,
```

## PDF page 31

```text
finding that collars    achieved substantially lower horizontal error (2.13–2.30 m)                  and higher fix

acquisition   success     (77.16–79.70%)       than   ear   tags  (23.58    m   error; 41.23–73.59% success),

concluding that solar-powered GPS devices, combined with advanced data interpretation, offer

a powerful tool     for pasture-based       cattle  productivity.   Stewart   et  al. (2025) similarly compared

solar-powered      GPS ear tags with conventional GPS neck collars, reporting a mean horizontal

error of 41 m for ear tags versus 2 m for collars, and a decline in fix acquisition to 30.7% for ear

tags versus 100% for collars during animal deployment, largely attributable to battery depletion;

despite this comparatively lower accuracy and data yield, the solar-powered ear tags remained

substantially   advantageous        in terms    of cost   and maintenance-free operation.            These    studies

indicate   that  solar  power     is a  technically   viable   and   increasingly     refined   energy    source    for

livestock tracking devices, though device form factor (collar versus ear tag), power-electronics

design, and environmental variability continue to shape real-world accuracy and reliability.




Testing Accuracy, Reliability and Functionality of GPS

Functionality

         Janwadkar et al. (2021) developed a GPS-based personal tracking system that utilized

GPS and GSM technologies for real-time location monitoring. During system evaluation, the

researchers verified the operational performance of the developed prototype by confirming that

the GPS receiver was able to successfully acquire valid latitude and longitude coordinates,

continuously update the tracked object's location as it moved, and provide location information

for transmission to the monitoring station. The successful execution of these functions

demonstrated that the GPS module was capable of supporting continuous real-time tracking

within the developed system.

         Following the same evaluation principle, the present study verifies the functionality of

the GPS module by determining whether it successfully performs the intended functions
```

## PDF page 32

```text
required by the proposed livestock tracking system. Specifically, the GPS module will be

evaluated based on its ability to acquire valid GPS coordinates, continuously update the

location of the livestock tracker as it moves, and provide coordinate data required for the

geofencing feature of the developed system. Successful completion of these intended functions

will demonstrate that the GPS module is operating properly and is capable of supporting the

tracking and geofencing functions of the proposed livestock tracking system.

Accuracy

         Xiong et al. (2024) evaluated the accuracy of commercial GPS sensors for livestock

tracking by comparing their recorded positions with highly accurate reference coordinates

obtained using a survey-grade Real-Time Kinematic (RTK) receiver. The researchers assessed

positioning performance using the Circular Error Probable at the 95% confidence level

(CEP95), reporting values ranging from 2.46 m to 11.06 m across the tested GPS devices.

CEP95 represents the radius within which 95% of the recorded GPS positions are expected to

fall and is widely used as a metric for evaluating GPS positioning accuracy. Their findings

demonstrated that comparing GPS-generated coordinates with established reference locations

is an effective method for assessing positioning accuracy in livestock tracking applications.

Following the same principle of comparing GPS measurements with known reference

coordinates, the present study evaluates the positioning accuracy of the proposed tracking

system by comparing the GPS coordinates generated by the tracker with predetermined

reference coordinates obtained from Google Maps. While RTK provides higher positional

accuracy and is commonly used as the standard reference in GPS validation studies, Google

Maps provides a practical and accessible means of establishing reference coordinates for

prototype evaluation. Accordingly, the present study adopts predetermined coordinates

obtained from Google Maps to assess the positioning accuracy of the proposed livestock

tracking system.
```

## PDF page 33

```text
Reliability

         Forin-Wiart et al. (2015) conducted a study entitled Performance and Accuracy of

Lightweight and Low-Cost GPS Data Loggers According to Antenna Positions, Fix Intervals,

Habitats and Animal Movements, which evaluated the performance of lightweight GPS tracking

devices under various operating conditions. The study assessed several performance

indicators, including GPS Fix Success Rate (FSR), location error, and the effects of antenna

position, habitat, fix interval, and animal movement on GPS performance. The researchers

reported a mean GPS Fix Success Rate of 90% ± 26%, indicating that the tracking devices

were able to successfully acquire GPS coordinates in most acquisition attempts despite

variations in environmental conditions. Guided by these findings, the present study will adopt a

minimum GPS Fix Success Rate of 90% as the acceptance criterion for evaluating the

reliability of the proposed GPS tracking system in consistently obtaining valid GPS coordinates.

         Finally, the importance of introducing environmental stressors—such as weather,

temperature, and animal movement, into the testing procedure is underscored by Cattani et al.

(2017), who emphasized the necessity of repeated testing under 'realistic operating conditions'

to ensure the system remains stable despite signal attenuation or multipath effects.



Synthesis

         The reviewed literature establishes that GPS, LoRa, geofencing, and Internet-based

monitoring technologies can be integrated to support livestock tracking and monitoring. GPS

provides the geographic coordinates needed to determine the position of livestock, while LoRa

provides a long-range, low-power communication medium for transmitting location data from a

wearable livestock tracker to a receiving device. Reis et al. (2021) demonstrated a livestock

monitoring system that combined GPS and LoRa for transmitting animal location and activity

information. Their system transmitted data through a LoRa gateway, which subsequently

uploaded the information to cloud-based services for storage and visualization.
```

## PDF page 34

```text
The use of LoRa for livestock monitoring is particularly relevant to rural and pasture

environments where conventional communication infrastructure may be limited. Ojo et al.

(2022) developed a livestock localization platform integrating a GPS-equipped wearable

device, LoRaWAN communication, and cloud services. Their study evaluated packet delivery

ratio, localization accuracy, energy consumption, battery discharge, and communication delay,

demonstrating the feasibility of combining long-range, low-power communication with

cloud-based livestock monitoring. Nyamuryekung’e et al. (2021) similarly evaluated LoRaWAN

GPS sensors for precision livestock applications at different distances from a gateway and

demonstrated the potential of the technology for livestock monitoring.

         The reviewed literature also demonstrates that LoRa communication reliability is

influenced by deployment conditions. Reis et al. (2021) reported packet loss during their

livestock field evaluation, while other livestock-monitoring deployments have demonstrated

variations in successful packet transmission depending on environmental and communication

conditions. Distance, terrain, vegetation, physical obstructions, and antenna placement can

affect signal quality and packet delivery. These findings indicate that a livestock tracking

system using LoRa requires evaluation under controlled conditions rather than assuming

consistent communication performance across all environments.

         Geofencing provides another important function for livestock monitoring. GPS

coordinates can be compared with a predefined geographic boundary to determine whether an

animal remains within its designated area. Previous livestock-monitoring systems have

implemented virtual perimeters and generated warnings when animals moved outside

designated boundaries. Vargas-Salazar et al. (2022), for example, demonstrated a cattle

geolocation system that incorporated LoRa communication, virtual-perimeter monitoring, and

notification mechanisms. Such implementations establish a basis for incorporating geofence

detection into a GPS-based livestock tracking system.
```

## PDF page 35

```text
The literature further demonstrates the feasibility of connecting livestock tracking

devices to Internet-based platforms for visualization and monitoring. Reis et al. (2021)

connected their LoRa gateway to an online platform for data storage and visualization, while

Ojo et al. (2022) incorporated cloud services into their livestock localization system. These

studies demonstrate that location information acquired by a livestock-mounted device can be

transmitted through a communication gateway and made accessible through an

Internet-connected platform. This provides a foundation for extending the proposed system to a

mobile application where users can visualize livestock locations and receive monitoring

information.

         Energy consumption is also an important consideration in the development of wearable

GPS-LoRa livestock trackers. GPS positioning and wireless transmission contribute

substantially to the power requirements of tracking devices. Ojo et al. (2022) evaluated energy

consumption and battery discharge as part of their livestock monitoring system, while other

studies have explored adaptive positioning and reduced positioning frequency to extend battery

life. These findings emphasize the need to balance GPS sampling frequency, LoRa

transmission frequency, battery capacity, and monitoring requirements when designing a

wearable tracker.

         Despite the established use of these technologies, the reviewed studies indicate

opportunities for further integration and evaluation. Existing research has demonstrated

GPS-LoRa livestock tracking, LoRa-based communication, geofencing, and Internet-based

visualization, but these functions have often been evaluated separately or within specific

system architectures. The proposed study seeks to integrate the GPS-equipped livestock

tracker, LoRa communication, master device, Internet connection, server, geofence monitoring,

and mobile application into a unified livestock monitoring platform.

         Communication reliability also warrants further evaluation because previous studies

have shown that LoRa performance varies according to distance and environmental conditions.
```

## PDF page 36

```text
Testing the developed system with different communication distances and multiple livestock

trackers can provide empirical data regarding packet delivery, successful reception, and

communication reliability within the intended operating environment.

         The integration of geofence monitoring with application-based visualization also

provides an area for system-level evaluation. While previous studies have demonstrated

livestock geolocation and virtual-perimeter alerts, the proposed system combines location

acquisition, wireless transmission, master-device processing, Internet communication, server

handling, map-based visualization, and boundary alerts within one platform. Evaluation can

therefore determine whether the location information received from the livestock tracker is

correctly represented in the application and whether movement beyond the predefined

boundary is appropriately detected.

         The practical operation of the wearable tracker also depends on its energy

requirements. Since GPS acquisition and LoRa transmission consume electrical power, the

proposed system must consider the relationship between location-update intervals,

transmission intervals, and battery capacity. Evaluating these factors can help determine

whether the developed tracker can operate for an appropriate period while maintaining the

required tracking functionality.

         Overall, the reviewed literature provides sufficient evidence that GPS can provide

livestock location information, LoRa can facilitate long-range transmission, geofencing can

determine movement relative to predefined boundaries, and Internet-connected platforms can

provide visualization and alerts. The proposed study builds upon these established

technologies by integrating them into a single livestock monitoring system. The developed

system will acquire the livestock's geographic coordinates through GPS, transmit the location

information through LoRa to a master device, transfer the received data through an Internet

connection to a server, and present the information through a mobile application. The

application can provide map-based visualization of livestock locations and generate alerts
```

## PDF page 37

```text
when an animal is detected outside its designated geofence. The study therefore focuses on

the integration and controlled evaluation of the complete tracking and monitoring architecture,

particularly its location accuracy, LoRa communication reliability, geofence functionality,

application visualization, and practical energy requirements.



Table 1
Synthesis of Related Literature


    Author(s) & Year              Focus of Study                Key Findings               Relevance / Gap
                                                                                             Addressed by
                                                                                                GLANCE

Ahmad & Ilyas (2020)         IoT-based livestock          Established feasibility      Foundational
                             tracking & geofencing        of remote geofenced          proof-of-concept;
                                                          monitoring for cattle        GLANCE extends this
                                                          via IoT                      to a LoRa-based,
                                                                                       goat-specific,
                                                                                       mobile-visualized
                                                                                       system
Schulthess et al.            LoRa/GNSS cattle             Demonstrated                 Validates GPS+LoRa
(2024)                       monitoring for remote        multi-month battery life combination; GLANCE
                             pastures                     (≈4 months) with             adapts this
                                                          GNSS-LoRa                    architecture with
                                                          integration                  geofencing and mobile
                                                                                       alerts
Aldhaheri et al. (2024); LoRa in Agriculture 4.0 LoRa is well-suited for               Directly motivates the
Pagano et al. (2023)         (survey)                     agriculture but faces        need for a unified,
                                                          scalability,                 integrated framework
                                                          interoperability, and        — GLANCE's core
                                                          integration limits           contribution

Abbas et al. (2019)          GPS-based                    Achieved ~95%                Confirms
                             geofencing for vehicles location accuracy with            GPS-geofencing
                                                          microcontroller-based        reliability; GLANCE
                                                          geofencing                   applies the same
                                                                                       principle to livestock
                                                                                       instead of vehicles
Meral & Güzel (2016)         GPS/GPRS                     Simple hardware can          Shows feasibility of
                             geofencing                   support reliable             low-cost hardware;
                             (Arduino/SIM908)             real-time geo-alerts via GLANCE replaces
                                                          cellular data                cellular (GPRS) with
                                                                                       LoRa to remove
```

## PDF page 38

```text
connectivity fees
Devi et al. (2019)           Waypoint-based                Multi-point boundaries       Supports GLANCE's
                             geofencing                    offer more flexibility       use of polygon
                                                           than fixed-radius            (ray-casting)
                                                           fences                       geofencing over simple
                                                                                        circular fencing
Chitrakar et al. (2021)      GPS + LoRa safety             Verified GPS-to-LoRa         Directly informs
                             alert system                  data pipeline over 2–5       GLANCE's
                                                           km                           tracker-to-master
                                                                                        communication
                                                                                        architecture
Wu et al. (2021)             Distributed queueing          DQ reduces collisions;       Basis for GLANCE's
                             for LoRa MAC                  up to 1.83× throughput multi-node
                                                           gain over ALOHA              queueing/collision-han
                                                                                        dling design
Kouskoulas et al.            Formally verified             Verified algorithm           Conceptual basis for
(2021)                       keep-in geofencing            reliably keeps               GLANCE's
                                                           autonomous platforms         boundary-violation
                                                           within bounds                detection logic
Alsaqer et al. (2015)        Geo-triggering                Adaptive tracking            Informs GLANCE's
                             accuracy & battery use achieved 100%                       tradeoff between alert
                                                           reliability but affects      reliability and power
                                                           battery life                 consumption
Jayapradha et al.            GPS-based location            Demonstrated                 Extended in GLANCE
(2024)                       alerts                        arrival-based alarm          into a livestock
                                                           triggering                   boundary-exit alert
                                                                                        with actionable info
                                                                                        (ID, time, location)
Haas & Casali (2017)         Auditory warning              Pulse pattern and level Basis for GLANCE's
                             signal design                 affect perceived             intermittent-pulse
                                                           urgency and response         audio beacon design
                                                           time
Wilson et al. (2021);        Tag/collar weight limits      Collar mass should be        Basis for GLANCE's
Lamanna et al. (2025)                                      0.5–5% of animal body ~198g tracker design
                                                           weight depending on          (0.78–0.79% of a 25kg
                                                           species/context              goat)
Siguín et al. (2021);        GPS/LoRa antenna              Dorsal, sky-facing           Directly adopted in
Perea et al. (2025)          placement on collars          antenna position             GLANCE's collar and
                                                           improves fix success         antenna design
                                                           and signal reliability

Hasan et al. (2023)          IoT battery technology        No single battery            Basis for GLANCE's
                             comparison                    chemistry fits all IoT       LiPo battery selection
                                                           use cases; Li-ion/LiPo
```

## PDF page 39

```text
offer balanced
                                                          performance
Scheepers et al.             Solar-powered                Solar collars can            Supports GLANCE's
(2017); Mendes et al.        livestock trackers           sustain operation            solar-powered collar
(2025); Stewart et al.                                    without sunlight for up      concept and design
(2025)                                                    to a week; collars           tradeoffs
                                                          outperform ear tags in
                                                          accuracy
Xiong et al. (2024)          GPS accuracy                 CEP95 accuracy of            Basis for GLANCE's
                             validation (RTK              2.46–11.06 m across          accuracy-testing
                             reference)                   commercial GPS units         methodology using
                                                                                       reference coordinates
Forin-Wiart et al.           GPS Fix Success Rate Mean FSR of 90% ±                    Basis for GLANCE's
(2015)                       under varied                 26% across                   90% minimum FSR
                             conditions                   environmental                acceptance criterion
                                                          conditions
```

## PDF page 40

```text
Chapter 3



                                                  Methodology



         This chapter presents the research methodology in the development and testing of the

proposed system, which will be now labelled as “GLANCE” (GPS, LoRa, And Network Collar

Ensemble). It describes the design, system architecture, components, and testing procedures

that will be used to achieve the objectives of the study.



Design Criteria

         The system is designed to integrate livestock tracking and identification into a unified

platform. The criteria emphasize the following:

Functionality

         Functionality is defined as the extent to which all intended features of the system

operate correctly and according to design specifications. The proposed system incorporates

multiple functions such as LoRa communication, GPS tracking and geofencing, handheld form

factor, and alert features. Evaluation of functionality will employ a checklist-based approach to

confirm that each feature performs its intended operation without errors.

Tracking Accuracy

         Accuracy for tracking refers to how closely the GPS fix is to the predetermined Google

Maps latitude and longitude. Following the evaluation methods presented by Vazquez-Rodas et

al. (2020) and Podevijn et al. (2018), tracking accuracy will be assessed by comparing the

estimated position of the tracker with reference positions and their corresponding latitude and

longitude found on Google Maps. Accuracy will be determined by placing the tracker at these

predetermined reference locations. Each five (5) location reference points will be tested for a
```

## PDF page 41

```text
total of 3 trials each point to account for variations from environmental conditions, signal

propagation, and wireless communication noise.

Tracking Reliability

         Tracking reliability is the tracking system's ability to consistently perform its intended

functions under both normal and changing environmental conditions. The tracking system must

maintain stable operation while continuously executing GPS tracking. Tracking reliability will be

evaluated through continuous operation and environmental testing under varying conditions,

including rainfall exposures, temperature changes, and animal movement. The reliability of the

tracking system will be assessed using the GPS fix success rate. The system shall achieve a

minimum GPS Fix Success Rate of 90%, based on the findings of Forin-Wiart et al. (2015),

established through engineering judgment to ensure continuous and reliable operation

throughout the testing period.



Design Constraints

         The development of the proposed livestock tracking system is subject to several

limitations that may affect its performance and deployment. The constraints considered in the

design include the following:

Power Consumption

         The excessive energy requirement due to the GPS module is a major hardware

constraint that causes significant constraints on the battery life of the wearable GPS cattle

collar. Since such types of tracking systems are used in rural farmlands where there are no

constant sources of electricity available, it is important that the entire system should operate

solely on battery power with intermittent wake-up intervals to conserve energy. Even though

there are advanced wireless communication systems like LoRa that are very efficient in terms

of energy and have low power consumption, the satellite polling that needs to be done

continuously by the collar's GPS module consumes excess energy. To combat these
```

## PDF page 42

```text
constrictions, the system will implement the algorithmic solution RAPS. Although full

implementation of RAPS is most applicable for smartphones, RAPS can be mimicked using

modules such as the U-Blox. An AAU of 10m will be used with a simplified speed model named

“dynamic speed model” Jurdak et al. (2010) which sets the assumed speed for future

uncertainty estimation as the last observed speed reported by the GPS module during its most

recent position fix. This approach relies on the principle of speed persistence, which assumes a

high correlation between the most recent speed measurement and the current velocity,

allowing the system to adaptively trigger the next GPS activation once the estimated

uncertainty grows to reach the specified 10m limit.

Satellite Visibility Requirements

         The performance and accuracy of GPS/GNSS trackers depend heavily on clear

line‑of‑sight to satellites. For small ruminants such as goats, the ideal position of the GPS

antenna is at the top of the neck, facing upwards toward the sky, which maximizes satellite

visibility and increases the Fix Success Rate (FSR) while reducing location error (Siguín et al.,

2021). Because goats are active grazers and frequently move their heads, collar designs must

ensure the antenna remains oriented skyward. Telemetry devices achieve this through a

counterweight system, where the heavier battery or electronics housing is positioned ventrally

(under the neck). Gravity keeps the antenna consistently directed dorsally (upward), ensuring

reliable positioning data (Siguín et al., 2021).

         Recent IoT‑based livestock tracking devices also adopt this design principle, integrating

GPS antennas into collars that maintain upward orientation even during grazing and browsing

activities (Araujo et al., 2024). However, given the constrictions on weight and size, the system

will be directed upwards in a fixed, dorsal-side position where the antennas are placed facing

away from the animal and towards the sky.
```

## PDF page 43

```text
Size Constraint of the Tracker

         There are size constraints associated with wearable trackers for animals such as goats.

Fitting all components within a tracker requires thoughtful design and consideration of

enclosure size. Too large of an enclosure will make it bulky and uncomfortable for the goat; too

small of an enclosure will limit functionality. Considering these constraints, it was determined

that an enclosure of dimensions 92 mm by 58 mm by 23 mm is appropriate, providing the

maximum functional space for all of the components without sacrificing wearability.

Weight Constraint of the Tracker

         The estimated tracker weight of approximately 96.2 g, including the enclosure, battery,

electronic components, collar, and mounting hardware, is considered feasible, safe, and

compliant with established animal welfare guidelines for goats weighing approximately 25 kg.

At this weight, the device represents approximately 0.38%–0.39% of the animal's body weight,

which falls within the stringent Precision Livestock Farming (PLF) recommendation of

0.5%–1.0% for most animals (Lamanna et al., 2025). Furthermore, the device remains well

below the recommended weight limit for animals during movement of 1.6%–2.98% and the

traditional maximum device weight guideline of 3%–5% (Wilson et al., 2021). The estimated

tracker weight was calculated based on the selected hardware components presented in Table

2.
```

## PDF page 44

```text
Table 2

Estimated Weight of the Tracker Components

                                 Component                                          Estimated Weight (g)

                      ESP32-C3 Mini Microcontroller                                              4

                 GY-NEO6MV2 (NEO-6M) GPS Module                                                 1.6

                    SX1276 LoRa Transceiver Module                                               3

                    TP4056 Battery Charging Module                                               2

                   MT3608 DC-DC Step-Up Converter                                                3

                        3.7V 100 mAh LiPo Battery                                               1.6

                   5V 50mA 60mm x 44mm solar panel                                              20

                        ABS Enclosure (58 x 92 x 23)                                            26

                              Adjustable Collar                                                 25

               Connecting Wires and Mounting Hardware                                           10

                          Total Estimated Weight                                               96.2




        Table 2 presents the estimated weight of the tracker based on the selected hardware

components that will be purchased and used in the development of the proposed system. The

estimated total weight is approximately 96 g, including the electronic components, battery,

enclosure, collar, and mounting hardware. These values are based on the specifications

provided by the selected suppliers and may vary slightly during the actual assembly of the

prototype. The estimated weight serves as the basis for the design constraint, ensuring that the

tracker remains suitable for collar-mounted livestock monitoring while minimizing interference

with the animal's normal movement.
```

## PDF page 45

```text
Design Plan Preparation








































Figure 2

Procedural Flowchart for the GPS-Based Tracking and Geofencing System with LoRa

Communication for Livestock Tracking



         The development of the proposed system will follow a systematic procedure to ensure

that the objectives of the study are achieved. The process will begin with the design plan and

preparation, during which system requirements will be identified and the overall hardware and
```

## PDF page 46

```text
software architecture of the GPS-based tracking and geofencing system with LoRa

communication will be developed. During this stage, the system components, operational flow,

circuit connections, and software functions will be planned based on the desired features and

performance of the prototype.

         After completing the design plan, the selection and procurement of materials will

proceed. The required electronic components, including the ESP32-C3 mini and

ESP32-WROOM 32D microcontroller, GPS module, LoRa transceiver, rechargeable

lithium-polymer battery, charging module, voltage booster, enclosure, and other supporting

materials, will be selected according to the system requirements and acquired for prototype

development.

         The next phase will involve the construction and integration of the prototype, wherein all

hardware components will be assembled and interconnected based on the designed circuit.

The necessary firmware and software will then be developed and uploaded to the

microcontroller to enable GPS positioning, LoRa communication, geofencing, and real-time

monitoring through the local web server interface. The integration of both hardware and

software will ensure that the individual subsystems operate as a single functional livestock

tracking system.
```

## PDF page 47

> Visual note (reviewer, not source text): Figure 3 shows a GPS antenna/GY-NEO6MV2, ESP32-C3, SX1276, TP4056, MT3608, 5 V 50 mA solar panel, and 3.7 V LiPo labelled 100 mAh. Small pin labels are not verified.

```text
Figure 3

Schematic of GLANCE tracker



         Referring to Figure 4, the GPS module is communicating with the microcontroller unit

(MCU) through UART protocol, and the LoRa module in SPI. On the power side, the battery is

connected to the battery charger TP4056 to allow recharging, while at the same time powering

the entire circuit through the boost converter MT3608 to provide a steady 5V supply to the

MCU.
```

## PDF page 48

> Visual note (reviewer, not source text): Figure 4 shows an ESP32-C3, SX1276, microSD module, TP4056, MT3608, and a 3.7 V LiPo labelled 1000 mAh; no GPS module is shown. Small pin labels are not verified.

```text
Figure 4

Schematic of GLANCE Master Device



         Figure 5 shows a schematic for the GLANCE master device with similar components to

the tracker.

         Following the construction of the prototype, functionality testing will be conducted to

verify that each component and subsystem will operate according to the intended design. The

GPS module will be tested for successful coordinate acquisition, the LoRa communication

module will be verified for successful transmission and reception of GPS data, and the

geofencing feature will be verified to ensure proper boundary detection and alert generation. If

any hardware or software component failed to perform according to the design specifications,
```

## PDF page 49

```text
the necessary modifications, debugging, and recalibration will be carried out before repeating

the functionality test. This process will continue until the prototype operates as intended.

         Once the prototype successfully meets all functional requirements, the system will be

considered ready for controlled environment testing. The developed prototype then will

undergo a series of controlled tests to determine its performance in terms of GPS accuracy,

GPS reliability, GPS functionality, geofencing functionality, and LoRa communication

performance. During this stage, the required quantitative and qualitative data will be gathered

and recorded using the designated research instruments and testing procedures.

         Finally, the collected data will be organized and analyzed to determine whether the

developed GPS-based tracking and geofencing system with LoRa communication satisfied the

objectives and design requirements of the study. The results of the testing will serve as the

basis for evaluating the overall performance, effectiveness, and applicability of the proposed

livestock tracking system.



Assessment of Load Calculations, PV Module, and Battery of the System

Load Calculations

         The load calculation of the GLANCE tracker will be based on the study of Zerrad and

Arouch (2022). The power requirements for each component will be solved using the formula:



𝑃𝑜𝑤𝑒𝑟 (𝑖𝑛 𝑊𝑎𝑡𝑡𝑠)       =   𝑉𝑜𝑙𝑡𝑎𝑔𝑒 (𝑖𝑛 𝑉𝑜𝑙𝑡𝑠) 𝑥 𝐶𝑢𝑟𝑟𝑒𝑛𝑡 (𝑖𝑛 𝐴𝑚𝑝𝑒𝑟𝑒𝑠)
```

## PDF page 50

```text
Table 3

Load Calculation of the GLANCE tracker

    Equipment                 No. of            Wattage (mW)          Daily Working           Total Energy
       Name                Equipment                                 Hours (hrs/day)           Consumed
                                                                                              (mW-hr/day)

  ESP32-C3 Mini                  1                    150                     0.8                   120
  Microcontroller

  GY-NEO6MV2                     1                     10                     24                    250
 (NEO-6M) GPS
      Module

  SX1276 LoRa                    1                    0.15                    24                     3.6
    Transceiver
      Module

        Total                                        59.15                                         373.6

𝑇𝑜𝑡𝑎𝑙 𝐸𝑛𝑒𝑟𝑔𝑦     =    373. 6  𝑚𝑊 − ℎ𝑟
                                𝑑𝑎𝑦

𝑃𝑎𝑛𝑒𝑙 𝐺𝑒𝑛𝑒𝑟𝑎𝑡𝑖𝑜𝑛 𝐹𝑎𝑐𝑡𝑜𝑟 𝑜𝑟 𝐸𝑛𝑒𝑟𝑔𝑦 𝐿𝑜𝑠𝑡 𝑖𝑛 𝑎 𝑆𝑦𝑠𝑡𝑒𝑚               =   1.3

𝐴𝑣𝑒𝑟𝑎𝑔𝑒 𝑆𝑢𝑛 ℎ𝑜𝑢𝑟 𝑖𝑛 𝑡ℎ𝑒 𝑃ℎ𝑖𝑙𝑖𝑝𝑝𝑖𝑛𝑒𝑠          =   4. 5 ℎ𝑟𝑠

𝑇𝑜𝑡𝑎𝑙 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙𝑠 𝐸𝑛𝑒𝑟𝑔𝑦 𝑁𝑒𝑒𝑑𝑒𝑑 (𝐸)            =   373. 6𝑥 1. 3  =  485.  68  𝑚𝑊 − ℎ𝑟
                                                                              𝑑𝑎𝑦
𝑇𝑜𝑡𝑎𝑙 𝑊𝑎𝑡𝑡     −  𝑝𝑒𝑎𝑘 𝑜𝑓 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙 𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 𝑁𝑒𝑒𝑑𝑒𝑑            =           𝐸
                                                                  𝐴𝑣𝑒𝑟𝑎𝑔𝑒 𝑠𝑢𝑛 ℎ𝑜𝑢𝑟
𝑇𝑜𝑡𝑎𝑙 𝑊𝑎𝑡𝑡     −  𝑝𝑒𝑎𝑘 𝑜𝑓 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙 𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 𝑁𝑒𝑒𝑑𝑒𝑑            =   485.68
                                                                  4.5 ℎ𝑟𝑠

𝑇𝑜𝑡𝑎𝑙 𝑊𝑎𝑡𝑡     −  𝑝𝑒𝑎𝑘 𝑜𝑓 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙 𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 𝑁𝑒𝑒𝑑𝑒𝑑            =  108 𝑚𝑊𝑎𝑡𝑡      −   𝑝𝑒𝑎𝑘

𝑁𝑜. 𝑜𝑓 𝑃𝑎𝑛𝑒𝑙𝑠 𝑁𝑒𝑒𝑑𝑒𝑑       =    𝑇𝑜𝑡𝑎𝑙 𝑊𝑝 𝑜𝑓 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙  𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 𝑁𝑒𝑒𝑑𝑒𝑑
                                      𝑊𝑝 𝑜𝑓 𝑆𝑒𝑙𝑒𝑐𝑡𝑒𝑑 𝑃𝑉 𝑃𝑎𝑛𝑒𝑙
𝑁𝑜. 𝑜𝑓 𝑃𝑎𝑛𝑒𝑙𝑠 𝑁𝑒𝑒𝑑𝑒𝑑       =    108  =  0.432   ≈  1 𝑚𝑖𝑐𝑟𝑜 𝑠𝑜𝑙𝑎𝑟 𝑝𝑎𝑛𝑒𝑙
                                250
```

## PDF page 51

```text
Battery Sizing

𝐵𝑎𝑡𝑡𝑒𝑟𝑦 𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 (𝐴ℎ)

=    𝑇𝑜𝑡𝑎𝑙 𝑊𝑎𝑡𝑡 − ℎ𝑜𝑢𝑟 𝑝𝑒𝑟 𝑑𝑎𝑦 𝑢𝑠𝑒𝑑 𝑏𝑦 𝑡ℎ𝑒 𝑠𝑦𝑠𝑡𝑒𝑚 𝑥 𝐷𝑎𝑦𝑠 𝑜𝑓 𝐴𝑢𝑡𝑜𝑛𝑜𝑚𝑦
        𝐵𝑎𝑡𝑡𝑒𝑟𝑦 𝐿𝑜𝑠𝑠 𝑥 𝐷𝑒𝑝𝑡ℎ 𝑜𝑓 𝐶ℎ𝑎𝑟𝑔𝑒 𝑥 𝑁𝑜𝑚𝑖𝑛𝑎𝑙 𝐵𝑎𝑡𝑡𝑒𝑟𝑦 𝑉𝑜𝑙𝑡𝑎𝑔𝑒

                                     373.6 𝑥 168 ℎ𝑟𝑠 𝑥 1 𝑑𝑎𝑦
𝐵𝑎𝑡𝑡𝑒𝑟𝑦 𝐶𝑎𝑝𝑎𝑐𝑖𝑡𝑦 (𝐴ℎ)           =                     24 ℎ𝑟𝑠=   95.  188   ≈   100 𝑚𝐴ℎ
                                         0.85 𝑥 0.8 𝑥 3.7

The battery should be rated at 3.7 VDC, 100 mAh for 168 hours of autonomy.














Figure 5

System Flowchart of the GLANCE System



         Figure 5 shows the distinctions between the tracker collar and the master device as well

as the other systems interacting with the proposed system.
```

## PDF page 52

```text
Figure 6

Pairing, and Data Transmission and Processing Flowchart



         Figure 6 demonstrates the process flow in geofencing from GPS (coordinates) to

screen (user feedback) trackers will send out connectivity requests with a device ID to attempt

pairing with the master device. Once received by the master device, it will assign a queueing

number to each received signal in the case of messages received within a short time from each

other. The master device will send out an acceptance message addressed to a specific device

ID and, one by one, the trackers will send out GPS information.

GPS Geofencing

         The GPS-based tracking and geofencing will make use of a ray-casting algorithm with a

supplementary triple check by subtly shifting the latitude up and down. The ray casting

algorithm is a technique for in-polygon-testing with the use of a single ray that passes through

the geofence shape. The test for inside or outside includes counting how many boundaries of

the geofence shape it intersects — odd number for inside and even number for outside.
```

## PDF page 53

```text
Figure 7

Geofencing Process Flowchart



         As illustrated in Figure 7, the process begins when the tracker periodically transmits a

ranging request through LoRa communication. Upon receiving a confirmation message, GPS

information is shared. The master device then receives the GPS information and applies the

ray-casting algorithm by comparing tracker latitude with boundary pair vertices for inclusion or

exclusion. The system determines whether the livestock remains inside the designated

boundary. If the calculated position lies within the geofence, the system continues monitoring
```

## PDF page 54

```text
and displays the tracker status. Otherwise, a geofence breach is detected and an alert is

generated to notify the farmer. This operational sequence is summarized in Figure 8.

































Figure 8

Rough separated 3D Render of the GLANCE Tracker



         Figure 8 shows a bisected 3D render of the GLANCE tracker with labeled components.

The GPS module and all communication devices are placed at the top to minimize signal

blocking. Heavier parts such as the battery, as well as all other power modules are placed at

the bottom for stability. The collar will be fastened to the enclosure using bolts, and the

enclosure itself will be made of waterproof ABS plastic.
```

## PDF page 55

```text
Construction and Implementation

         The process combines structured engineering with practical assembly:

Prototype Development

         The initial prototype will be assembled using the ESP32-C3 Mini microcontrollers, the

u-blox NEO-6M GPS module, the LoRa SX1276 transceiver, and a micro-SD card module

mounted on a perfboard. The prototype will be used to validate GPS data acquisition, LoRa

communication, and local data storage before final system integration.

Firmware Implementation

         Firmware development will focus on enabling the ESP32-WROOM32D. The firmware

will process GPS coordinates received from the tracker through the LoRa network, evaluate

whether the livestock remains within the predefined geofence, and generate alerts whenever

boundary violations are detected. It will also store monitoring records on the micro-SD card for

future reference.

GPS and LoRa Integration

         The livestock tracker will intermittently obtain the animal's geographic coordinates using

the u-blox NEO-6M GPS module. The acquired location data will be transmitted to the master

device through the LoRa SX1276 transceiver, allowing long-range communication while

maintaining low power consumption. Integrating GPS and LoRa provides both real-time

livestock monitoring and offline ownership verification within a single system.

Physical Build and Assembly

         After successful prototype validation, the GLANCE will be enclosed in durable

protective casings suitable for outdoor agricultural environments. The GPS antenna will be

positioned to maximize satellite reception, while the LoRa antenna will be installed to optimize

communication range and minimize signal interference. Waterproof sealing and shock-resistant

mounting will be incorporated to protect the electronic components from rain, dust, and animal

movement.
```

## PDF page 56

```text
Iterative Testing and Refinement

         Testing will be conducted in successive stages, beginning with initial testing to verify

GPS acquisition, LoRa communication, and web server operation. This will be followed by

controlled outdoor testing to evaluate GPS accuracy, geofence detection, and communication

reliability. The GLANCE system will be evaluated for functionality prior to field testing where

functionality, accuracy, and reliability data will be collected.

Final Integration and Deployment

         Following successful validation of all hardware and software components, the complete

system will be deployed for livestock monitoring. The tracker attached to each animal will

intermittently acquire GPS coordinates and transmit them to the master device through the

LoRa network. The master device will process the received location data, monitor geofence

status, and store monitoring records on the micro-SD card. System performance will be

evaluated using metrics such as functionality, accuracy, and reliability. The results will serve as

the basis for recommending future enhancements to improve system performance, energy

efficiency, and scalability for larger livestock farming operations.
```

## PDF page 57

```text
Figure 9

Field Testing Location



         Figure 9 shows the location of field testing, which is Casa Valencia, Pulao, Dumangas,

Iloilo. It features 3.6 thousand square meters of forested and open land, which the owner has

agreed to grant use of for field testing.



Testing Procedure

         The developed system will undergo a series of controlled tests to determine its overall

performance. The testing will focus on the system's functionality, accuracy, and reliability using

predefined testing procedures and repeated trials. Data gathered during the testing process will

be analyzed to determine whether the developed system satisfies the established design

criteria and performs its intended functions under controlled conditions.
```

## PDF page 58

```text
Functionality Testing for LoRa

         The functionality of the LoRa communication system will be evaluated through

controlled testing to verify its ability to perform the intended communication functions of the

proposed livestock tracking system. Specifically, the LoRa communication system will be tested

based on its ability to establish communication between the wearable tracker and the master

device, successfully receive and decode the transmitted device identification and GPS payload,

transmit GPS data under different environmental conditions, and simultaneously process data

transmitted by multiple tracking collars. The functionality test will be conducted through three

testing procedures: signal acceptance and pairing verification, environmental packet delivery

testing, and multi-node concurrent communication testing. The results obtained from these

tests will be used to determine whether the LoRa communication system performs according to

the intended design of the proposed system.



Signal Acceptance and Pairing Verification

         The first testing procedure will verify the ability of the master device to establish

communication with the wearable tracker. Prior to testing, the master device and tracker collar

will be powered on. The tracker will transmit its device identification and GPS payload through

the LoRa communication module. The master device will determine whether the transmitted

signal is successfully detected, decoded, and accepted. Successful communication will be

confirmed once the tracker is recognized by the master device and the transmitted payload is

correctly received. The results will be recorded using the checklist presented in Table 2 and

answered based on visual output in the display.
```

## PDF page 59

```text
Table 4

Signal Acceptance and Pairing Verification Checklist

  Functionality          Do the following functions work?                           Pass                        Fail


 Signal Detection       Did the master device successfully                           ☐                           ☐
                        detect the transmitted LoRa signal?

       Device           Was the tracker device successfully                          ☐                           ☐
   Identification       identified by the master device?

      Payload           Was the transmitted GPS payload                              ☐                           ☐
     Reception          successfully received and decoded?

 Communication          Was communication successfully
      Pairing           established between the tracker and                          ☐                           ☐
                        the master device?




Packet Delivery Testing

         The second testing procedure will verify the functionality of the LoRa communication

system. The tracker will intermittently transmit GPS data packets while positioned in the

designated testing environments. The master device will record whether the transmitted

packets are successfully received and decoded throughout the testing period. The successful

reception of transmitted packets will indicate proper operation of the LoRa communication

systems. The results gathered by visual inspection of the display will be recorded in Table 3.
```

## PDF page 60

```text
Table 5

Packet Delivery Checklist

  Functionality          Do the following functions work?                           Pass                        Fail


       Packet           Did the tracker successfully transmit                         ☐                          ☐
   Transmission         GPS data packets?

       Packet           Did the master device successfully                            ☐                          ☐
     Reception          receive the transmitted GPS data
                        packets?

  Data Decoding         Was the received GPS payload                                  ☐                          ☐
                        correctly decoded by the master
                        device?




Multi-Node Concurrent Communication Testing

         The third testing procedure will verify the ability of the master device to process

simultaneous transmissions from multiple tracker collars. During testing, all tracker collars will

be activated and configured to transmit GPS data simultaneously. The master device will

determine whether all transmitted packets are successfully received, processed, and recorded

without communication failure. Successful processing of all incoming transmissions will indicate

that the LoRa communication system is capable of supporting multiple tracker collars

simultaneously. The results will be recorded using the checklist presented in Table 4.
```

## PDF page 61

```text
Table 6

Multi-Node Concurrent Communication Checklist

  Functionality          Do the following functions work?                            Pass                        Fail


   Simultaneous         Did all tracker collars successfully                          ☐                           ☐
   Transmission         transmit data simultaneously?

    Multi-Node          Did the master device successfully                            ☐                           ☐
     Reception          receive data from all active trackers?

       Queue            Was each transmitted packet
    Processing          successfully processed and recorded                           ☐                           ☐
                        by the master device?




GPS Testing

         The GPS module will undergo a series of controlled tests to determine its performance

within the proposed livestock tracking system. The testing will focus on the module's accuracy,

reliability, and functionality to verify its suitability for GPS-based tracking and geofencing.

Functionality

         The functionality of the GPS module will be evaluated using the checklist presented in

Table 6. The test aims to verify whether the NEO-6M GPS module performs its intended

functions within the developed livestock tracking system. Specifically, the GPS module will be

assessed based on its ability to successfully establish a valid GPS fix, acquire valid latitude

and longitude coordinates, continuously update the tracker's location at 30-second interval,

provide uninterrupted coordinate readings throughout the testing period, accurately track the

movement of the wearable collar, and make the acquired coordinates available for geofencing

and LoRa communication. Each criterion will be marked as Pass if the intended function is

successfully performed and Fail if the function is not achieved. The results of the functionality
```

## PDF page 62

```text
test will be used to determine whether the GPS module operates according to the design

requirements of the proposed system.



Table 7

GPS Functionality Checklist

 Functionality          Do the following functions work?                           Pass                        Fail


       GPS            Did the NEO-6M GPS module                                      ☐                          ☐
   Initialization     successfully establish a valid 3D GPS
                      fix?

       GPS            Was the GPS module able to acquire                             ☐                          ☐
   Coordinate         valid latitude and longitude
   Acquisition        coordinates?

     Position         Did the GPS module accurately reflect                          ☐                          ☐
     Tracking         changes in the tracker's position during
                      movement?

   Coordinate         Were the acquired GPS coordinates                              ☐                          ☐
   Availability       successfully provided for geofencing
                      and LoRa communication?


Accuracy

         The accuracy of the GPS module will be evaluated by comparing the GPS coordinates

generated by the tracking device with predetermined reference coordinates obtained from

Google Maps. Prior to testing, five (5) reference points within the designated testing area will

be established, and their corresponding latitude and longitude coordinates will be identified and

recorded using Google Maps through a smartphone. These reference coordinates will serve as

the basis for evaluating the positioning accuracy of the GPS module throughout the testing

procedure.

         At each reference point, the wearable tracking collar will be placed in a fixed position

and allowed sufficient time to establish a valid GPS fix before recording the measured latitude
```

## PDF page 63

```text
and longitude coordinates. Three (3) trials will be conducted at each reference point to account

for normal variations in GPS positioning. For every trial, the measured GPS coordinates will be

compared with the corresponding reference coordinates, and the positioning error will be

determined by calculating the distance between the two coordinate sets using the Haversine

formula. The average positioning error obtained from the three trials at each reference point will

then be computed to evaluate the positioning accuracy of the developed GPS tracking system.

The results of the accuracy test will be recorded in Table 7.



Table 8

Accuracy for Tracking Criteria

                                  Reference                   Measured GPS                          Positioning
 Reference                       Coordinates                    Coordinates                          Accuracy
    Points        Trial        (Google Maps)

                           Longitude        Latitude      Longitude         Latitude      Longitude           Latitude


                    1

       1            2

                    3

                    1

       2            2

                    3

                    1

       3            2

                    3

                    1

       4            2

                    3

                    1
```

## PDF page 64

```text
5            2

                    3


Reliability

         Tracking reliability will be evaluated by operating the tracking system continuously

under different environmental and operational conditions while monitoring its quantitative

performance indicators. The reliability evaluation will be conducted under varying weather

conditions, ambient temperature conditions, and animal movement conditions. The GPS Fix

Success Rate will be determined by comparing the number of successful GPS coordinate

acquisitions with the total number of GPS acquisition attempts initiated by the Rate-Adaptive

Positioning System (RAPS). Under RAPS, a GPS acquisition attempt is triggered whenever the

estimated positioning uncertainty reaches the predefined 10-meter Absolute Acceptable

Uncertainty (AAU). The proposed system will be considered reliable if it achieves a GPS fix

success rate of at least 90% throughout the testing period.



Table 9

Tracking Reliability for Weather—GPS Fix Success Rate

   Conditions                 No. of GPS                 No. of Successful Fixes              GPS Fix Success Rate
                       Acquisition Attempts                                                                (%)
                                (RAPS)

   Sunny day

    Rainy Day

   Cloudy Day




         For Table 8, the GPS Fix Success Rate will be evaluated under three weather

conditions: sunny, cloudy, and rainy, as determined by the official weather observations or
```

## PDF page 65

```text
forecasts of the Philippine Atmospheric, Geophysical and Astronomical Services Administration

(PAGASA). A sunny day refers to clear skies with no rainfall, a cloudy day to predominantly

overcast skies without rainfall, and a rainy day to periods with measurable rainfall. During each

weather condition, GPS acquisition attempts will be managed using the Rate-Adaptive

Positioning System (RAPS). Each acquisition initiated by RAPS will be considered one GPS fix

attempt, and the GPS Fix Success Rate will be computed by comparing the number of

successful GPS fixes with the total number of GPS acquisition attempts.


Table 10

Tracking Reliability under Different Ambient Temperature Conditions—GPS Fix Success Rate

 Temperature        Temperature               No. of GPS              No. of Successful           GPS Fix Success
  Conditions              (°C)               Acquisition                      Fixes                    Rate (%)
                                          Attempts (RAPS)

       Low               24-27
 Temperature

   Moderate              28-31
 Temperature

      High               32-35
 Temperature




        For Table 9, the GPS Fix Success Rate will be evaluated under three ambient

temperature conditions representative of typical environmental conditions in the Philippines:

low (24–27 °C), moderate (28–31 °C), and high (32–35 °C), based on temperature ranges

reported by the Philippine Atmospheric, Geophysical and Astronomical Services Administration

(PAGASA). Ambient temperature will be measured using a digital thermometer or verified

through the nearest PAGASA weather observation before testing. GPS acquisition attempts will

be managed using the Rate-Adaptive Positioning System (RAPS). Each acquisition initiated by

RAPS will be considered one GPS fix attempt, and the GPS Fix Success Rate will be
```

## PDF page 66

```text
computed by comparing the number of successful GPS fixes with the total number of GPS

acquisition attempts.


Table 11


Tracking Reliability for Animal Movements - GPS Fix Success Rate

   Conditions                 No. of GPS                 No. of Successful Fixes             GPS Fix Success Rate
                       Acquisition Attempts                                                               (%)
                                (RAPS)

        Idle

     Walking

     Running




         For Table 10, the GPS fix success rate will be evaluated under three animal movement

conditions: idle, walking, and running. During the idle condition, the goat wearing the tracking

collar will remain stationary, while during the walking and running conditions, the goat will move

at its normal walking and running pace within the designated testing area. GPS acquisition

attempts will be managed using the Rate-Adaptive Positioning System (RAPS). Each

acquisition initiated by RAPS will be considered one GPS fix attempt, and the GPS Fix

Success Rate will be computed by comparing the number of successful GPS fixes with the

total number of GPS acquisition attempts.



Instrumentation

         To gather the data necessary for evaluating the performance of the proposed system,

the researchers will employ the following instruments during controlled testing:
```

## PDF page 67

```text
Master device

         The master device, consisting of the ESP32 microcontroller, LoRa receiver, and

microSD card holder, will serve as the primary monitoring instrument. It will receive GPS

coordinates transmitted by the tracker, send GPS data to the app via the internet, and record

communication data during testing.

Google Maps

         Google Maps will serve as the reference instrument for establishing the predetermined

coordinates of the selected test locations. The reference coordinates obtained from Google

Maps will be compared with the GPS coordinates generated by the tracking device to

determine the positioning error and evaluate the accuracy of the proposed system.



Data to be Gathered

         The following data will be gathered to evaluate the functionality, accuracy, and reliability

of the proposed livestock tracking system:

GPS Positioning Data

         GPS positioning data will be gathered by recording the GPS coordinates generated by

the tracking device and the predetermined reference coordinates obtained from Google Maps

for each reference point. The positioning error between the reference coordinates and the

recorded GPS coordinates will be determined using the Haversine formula.

GPS Reliability Data

         GPS reliability data will be gathered by recording the total number of GPS coordinate

acquisition attempts and the number of successful GPS fixes obtained during testing under

different weather conditions, temperature variations, and simulated animal movements. These

data will be used to determine the GPS fix success rate.
```

## PDF page 68

```text
GPS Functionality Data

         GPS functionality data will be gathered by recording the results of the functionality

checklist, including successful GPS initialization, GPS fix acquisition, coordinate acquisition,

continuous coordinate updating, real-time tracking, and coordinate availability for geofencing

and LoRa communication.

Geofencing Data

         Geofencing data will be gathered by recording the GPS coordinates, reference

boundary coordinates, expected geofence status, actual geofence status, and alert generation

results. These data will be used to evaluate the functionality and accuracy of the geofencing

feature.

LoRa Communication Data

         Communication data will be gathered by recording the number of packets transmitted

by the tracker, the number of packets successfully received by the master device, the number

of lost packets, queue acceptance results, and packet delivery ratio during system operation.

Physical Wear and Tear

         Qualitative data will be gathered by observing the physical condition of the prototype

after testing, including any signs of material wear, enclosure damage, loose connections, or

other physical defects that may affect the performance and durability of the developed system.



Parameters to be Analyzed

         The following parameters will be evaluated to assess the performance and

effectiveness of the proposed system:

Accuracy of GPS Positioning

         The accuracy of GPS positioning will be analyzed by comparing the GPS coordinates

generated by the tracking device with the predetermined reference coordinates obtained from

Google Maps. The positional difference between the recorded and reference coordinates will
```

## PDF page 69

```text
be used to determine the positioning accuracy of the developed system. To calculate the

accuracy of GPS positioning, this formula will be used:



                             𝐿𝐴𝑇𝐺𝑃𝑆−𝐿𝐴𝑇𝑅𝐸𝐹                                                𝐿𝑂𝑁𝐺𝐺𝑃𝑆−𝐿𝑂𝑁𝐺𝑅𝐸𝐹
𝐺𝑃𝑆 𝐿𝐴𝑇 𝐴𝑐𝑐𝑢𝑟𝑎𝑐𝑦        =        𝐿𝐴𝑇        ×  100%  ;     𝐺𝑃𝑆 𝐿𝑂𝑁𝐺 𝐴𝑐𝑐𝑢𝑟𝑎𝑐𝑦         =         𝐿𝑂𝑁𝐺         ×   100%
                                    𝑅𝐸𝐹                                                             𝑅𝐸𝐹

Positioning Error of GPS

         The Haversine formula will be used to calculate the shortest distance between two

points on a sphere, given their latitudes and longitudes. The positioning error of the GPS

module will be analyzed by comparing the GPS coordinates and reference coordinates

obtained from Google Maps. The Haversine formula is stated as:










where:

    ●    d = distance between the reference coordinates and the GPS coordinates (meters)

    ●    r = radius of the earth (6,371,000m)

    ●    ϕ1 = Latitude of the reference coordinates (radians)

    ●    ϕ2 = Latitude of the GPS coordinates (radians)

    ●    λ1 = Longitude of the reference coordinates (radians)

    ●    λ2 =  Longitude of the GPS coordinates (radians)



GPS Functionality

         The functionality of the GPS module will be evaluated using a Pass/Fail checklist based

on its ability to establish a valid GPS fix, acquire valid latitude and longitude coordinates,
```

## PDF page 70

```text
continuously update the tracker's location, accurately reflect movement, and provide coordinate

data for the geofencing and LoRa communication subsystems.

Geofencing Functionality

         The functionality of the geofencing system will be analyzed by determining whether the

developed system correctly identifies the tracker's position relative to the predefined virtual

boundary and generates the appropriate geofence status and corresponding alert whenever

the tracker enters, exits, or remains outside the defined area.

GPS Fix Success Rate

         The GPS fix success rate will be determined by calculating the percentage of

successful GPS coordinate acquisitions out of the total number of GPS acquisition attempts. A

GPS fix will be considered successful when the tracking device obtains valid latitude and

longitude coordinates. This parameter will be used to evaluate the reliability of the proposed

GPS tracking system in obtaining GPS coordinates under different environmental conditions.

The GPS fix success rate will be calculated using the following formula:


                        𝐺𝑃𝑆 𝐹𝑖𝑥 𝑆𝑢𝑐𝑐𝑒𝑠𝑠 𝑅𝑎𝑡𝑒         =      𝑁𝑜. 𝑜𝑓 𝑆𝑢𝑐𝑐𝑒𝑠𝑠𝑓𝑢𝑙 𝐹𝑖𝑥𝑒𝑠 ×  100%
                                                          𝑇𝑜𝑡𝑎𝑙 𝑁𝑜. 𝑜𝑓 𝐹𝑖𝑥𝑒𝑠 𝐴𝑡𝑡𝑒𝑚𝑝𝑡𝑠
```

## PDF page 71

```text
References


Abbas, A. H., Habelalmateen, M. ihsan, Jurdi, S., Audah, L., & Alduais, N. (2019, November).
         (PDF) GPS based Location Monitoring System with geo-fencing capabilities.
         ResearchGate.
         https://www.researchgate.net/publication/337194171_GPS_based_location_monitoring
         _system_with_geo-fencing_capabilities


Addo-Tenkorang, R., et. al. (2019). Advanced animal track-&-trace supply-chain conceptual
         framework: An Internet of Things approach. Procedia Manufacturing, 33, 158-164.
         https://doi.org/10.1016/j.promfg.2019.02.009.


Ahiara, W. C., Udeani, H. U., Okey, D. O., & Ihekweaba, C. (2022, June 10). Near Field
         Communication Intelligent Remote Livestock Monitoring System (Nigeria) | NIPES -
         Journal of Science and Technology Research. ResearchGate.
         https://journals.nipes.org/index.php/njstr/article/view/361


Ahmad, M., & Ilyas, Q. M. (2020). Smart farming: An enhanced pursuit of sustainable remote
         livestock tracking and geofencing using IoT and GPRS. Wireless Communications and
         Mobile Computing, 2020, Article 6660733. https://doi.org/10.1155/2020/6660733


Aldhaheri, L., Alshehhi, N., Manzil, I. I. J., Khalil, R. A., Javaid, S., Saeed, N., & Alouini, M.-S.
         (2024). LoRa communication for Agriculture 4.0: Opportunities, challenges, and future
         directions. IEEE Journal [Manuscript submitted for publication].


Aleluia, V. M. T., Soares, V. N. G. J., Caldeira, J. M. L. P., & Rodrigues, A. M. (2022). Livestock
         monitoring: Approaches, challenges and opportunities. International Journal of
         Engineering and Advanced Technology (IJEAT). https://www.ijeat.org


Al Noamani, A. S., Hoque, H. A., & Nasar, M. (2026). IoT-enabled smart geofencing system for
         sustainable livestock monitoring. International Journal of Computer Applications,
         187(120), 20–27.


Andersen, T., et al. (2025). An experimental study of 2.4 GHz LoRa in air-to-ground
         communication. Develco.
         https://develco.dk/wp-content/uploads/2025/08/Develco-Article-An-Experimental-Study-
         of-2.4-GHz-LoRa-in-Air-to-Ground-Communication.pdf
```

## PDF page 72

```text
Anderson, D. M., Estell, R. E., & Cibils, A. F. (2013). Spatiotemporal cattle data—A plea for
         protocol standardization. Positioning, 4(1), 115–136.
         https://doi.org/10.4236/pos.2013.41012


Angrisano, A., Gaglione, S., & Gioia, C. (2013). GNSS reliability testing in signal-degraded
         scenario. International Journal of Navigation and Observation, 2013, Article 870365.
         https://doi.org/10.1155/2013/870365


Araujo, M., Leitão, P., Castro, M., Castro, J., & Bernuy, M. (2024). Development of an
         IoT-Based Device for Data Collection on Sheep and Goat Herding in Silvopastoral
         Systems. Sensors, 24(17), 5528. https://doi.org/10.3390/s24175528


Babu, V. S., et. al. (2024). Perovskite solar module enabled IoT asset tracking for wildlife
         conservation. IEEE Journal of Photovoltaics, 14(3).
         https://doi.org/10.1109/JPHOTOV.2024.3355406.


Baumgärtner, M. K., et. al. (2026). Suitability of solar-powered acceleration and global
         positioning devices for remote monitoring of equine welfare: A case study. Smart
         Agricultural Technology. https://doi.org/10.1016/j.atech.2026.102390.


Chairunnas, A., Firansyah, B., & Zen, D. S. (2023). Smart livestock monitoring system based
         on the Internet of Things (IoT) for efficiency and sustainability. European Journal of
         Research Development and Sustainability (EJRDS), 4(7). https://www.scholarzest.com


Chitrakar, P., Biradavolu, Y., & Yellampalli, S. S. (2021, November 30). GPS and Lora Module
         based safety alert system | IEEE conference publication | IEEE Explore. IEEE Explore.
         https://ieeexplore.ieee.org/document/9617337


Circuit Digest. (n.d.). Interfacing NEO-6M GPS module with ESP32.
         https://circuitdigest.com/microcontroller-projects/interfacing-neo6m-gps-module-with-es
         p32


Deshmukh, P., Bhajibhakre, A., Gambhire, S., Channe, A., & Deshpande, N. (2018). Survey of
         geofencing algorithms. International Journal of Computer Science Engineering
         Techniques, 3(2), 1–5. http://www.ijcsejournal.org


Devi, S., Alvares, S., & Lobo, S. (2019, April 11). GPS tracking system based on setting
         waypoint using Geo-Fencing | Asian Journal for Convergence in Technology (AJCT)
```

## PDF page 73

```text
ISSN -2350-1146. Asian Journal of Convergence in Technology.
         https://asianssr.org/index.php/ajct/article/view/738


Display Visions. (n.d.). W240X-28 preliminary specification [Datasheet].
         https://www.displayvisions.us/eng/pdf/grafik/W240X-28%20preliminary.pdf


Enock, K. S., Sagali, M. J., Jeannick, U. I., & Chen, D. (2025). LoRa-based smart agriculture
         monitoring and automatic irrigation system. Journal of Computer and Communications,
         13(3), 1-20. https://doi.org/10.4236/jcc.2025.133001


Feng, Z., Liu, Y., Zhang, H., & Chen, W. (2025). Efficient Internet of Things communication
         system based on near-field communication and long range radio. Sensors, 25(8), 2509.
         https://doi.org/10.3390/s25082509


Food and Agriculture Organization of the United Nations. (n.d.). Animal production.
         https://www.fao.org/animal-production/en/


Forin-Wiart, M.-A., Hubert, P., Sirguey, P., & Poulle, M.-L. (2015, June). (PDF) performance and
         accuracy of lightweight and low-cost GPS data loggers according to antenna positions,
         fix intervals, habitats and animal movements. Research Gate.
         https://www.researchgate.net/publication/278685897_Performance_and_Accuracy_of_
         Lightweight_and_Low-Cost_GPS_Data_Loggers_According_to_Antenna_Positions_Fix
         _Intervals_Habitats_and_Animal_Movements


Germani, L., Mecarelli, V., Baruffa, G., Rugini, L., & Frescura, F. (2019). An IoT architecture for
         continuous livestock monitoring using LoRa LPWAN. Electronics, 8(12), 1435.
         https://doi.org/10.3390/electronics8121435.


Godas, D. (2015). A Sensor Based Management and Monitoring System for the Identification
         of Lambs Focusing on Milk Productivity Upturns. HAICTA 2015 Proceedings, 651–658.
         https://ceur-ws.org/Vol-1498/HAICTA_2015_paper73.pdf


Hassan, W. H. (2022). Requirements, deployments, and challenges of LoRa technology: A
         survey. Sensors, 22(1), 273. https://doi.org/10.3390/s22010273


Ilyas, Q. M., & Ahmad, M. (2020). Smart farming: An enhanced pursuit of sustainable remote
         livestock tracking and geofencing using IoT and GPRS. Wireless Communications and
         Mobile Computing, 2020, Article 6660733. https://doi.org/10.1155/2020/6660733
```

## PDF page 74

```text
Islam, T., et al. (2023). A cyber-resilient livestock location monitoring and geo-fencing
        framework using deep autoencoder. ResearchGate.
        https://www.researchgate.net/figure/a-The-proposed-system-architecture-Each-livestoc
        k-IoT-device-consists-of-a-GPS-module_fig1_399057883.


Khonrang, J., Duangnakorn, P., Winyangkul, S., Saengsuwan, T., Rungraungsilp, S., &
        Boonlom, K. (2026, March). (PDF) design and performance evaluation of a Lora-based
        data transmission system for micro smart grid devices in water quality monitoring
        stations. Research Gate.
        https://www.researchgate.net/publication/403045812_Design_and_Performance_Evalu
        ation_of_a_LoRa-Based_Data_Transmission_System_for_Micro_Smart_Grid_Devices_
        in_water_quality_Monitoring_Stations


Kumar, M., & Shashidhara, H. R. (2023). IOT LoRa based agriculture monitoring system.
        International Journal of Research and Analytical Reviews (IJRAR), 10(3), 594-601.


Lahmadi, M. M., Zerrad, F.-E., Siti, F. Z., Baskoun, Y., Beraich, F. Z., Arouch, M., &
        TaouzariI, M. (2022). New ecological composter powered by solar panels without
        battery to produce organic fertilizers. International Journal of Emerging Technology and
        Advanced Engineering, 12(9), 14–22.https://doi.org/10.46338/ijetae0922_02


Lamanna, M., Bovo, M., & Cavallini, D. (2025). Wearable collar technologies for dairy cows: A
        systematized review of the current applications and future innovations in precision
        livestock farming. Animals, 15(3), Article 458. https://doi.org/10.3390/ani15030458


McGranahan, D. A., Geaumont, B., & Spiess, J. W. (2018). Assessment of a livestock GPS
        collar based on an open-source datalogger informs best practices for logging intensity.
        Ecology and Evolution, 8(11), 5649–5660. https://doi.org/10.1002/ece3.4094


Mendes, E., et. al. (2025). GPS precision and data acquisition efficiency of solar-powered
        collars and tags for beef cattle monitoring. Journal of Animal Science, 103(Suppl. 3).
        https://doi.org/10.1093/jas/skaf300.299.


Meral, E., & Güzel, M. S. (2016, October). (PDF) real-time geolocation tracking and geofencing
        using GPRS+GPS technologies with SIM908 shield over Arduino. ResearchGate.
        https://www.researchgate.net/publication/312479020_Real-time_geolocation_tracking_
        and_geofencing_using_GPRSGPS_technologies_with_SIM908_shield_over_Arduino


Micheal, D. (2024, November). (PDF) performance evaluation of location technologies in
        geofencing: GPS, Wi-Fi, Ble, and RFID. ResearchGate.
        https://www.researchgate.net/publication/394076546_Performance_Evaluation_of_Loca
        tion_Technologies_in_Geofencing_GPS_Wi-Fi_BLE_and_RFID
```

## PDF page 75

```text
Mohapatra, H. (2025). A LoRa-IoT framework with machine learning for remote livestock
         monitoring in smart agriculture. arXiv. https://arxiv.org/pdf/2510.07322


Müller, P., Stoll, H., Sarperi, L., & Schüpbach, C. (2021). Outdoor ranging and positioning
         based on LoRa modulation. 2021 International Conference on Localization and GNSS
         (ICL-GNSS), 1–6. https://doi.org/10.1109/ICL-GNSS51451.2021.9452277


Namoshe, M., et. al. (2017). Development of a hybrid power module for mobile wireless sensor
         networks: Towards a livestock tracking and identification system. American Journal of
         Engineering and Applied Sciences, 10(4), 825-834.
         https://doi.org/10.3844/ajeassp.2017.825.834.


Nosouhi, M. R., Sood, K., Doss, R., Li, G., Baig, Z., Sellathurai, A., & Kaushik, A. (2025). A
         reliable monitoring of livestock location and geo-fencing application. IEEE Internet of
         Things Magazine. https://doi.org/10.1109/MIOT.2025.3639008


Nyamuryekung’e, S., Duff, G., Utsumi, S., Estell, R., McIntosh, M. M., Funk, M., Cox, A., Cao,
         H., Spiegal, S., Perea, A., & Cibils, A. F. (2023). Real-time monitoring of grazing cattle
         using LORA-WAN sensors to improve precision in detecting animal welfare implications
         via daily distance walked metrics. Animals, 13(16), 2641.
         https://doi.org/10.3390/ani13162641


Pagano, A., Croce, D., Tinnirello, I., & Vitale, G. (2023). A survey on LoRa for smart agriculture:
         Current trends and future perspectives. IEEE Internet of Things Journal, 10(4),
         3664–3679. https://doi.org/10.1109/JIOT.2022.3230505


Pangestu, A., Al-Hakim, R. R., Wilyanti, S., Andriyani, D., Yusro, M., Ma’arif, A., Iswanto, I., &
         Purwono, P. (2023, November). (PDF) pet tracking system using GPS with
         Android-based Geofencing Method. ResearchGate.
         https://www.researchgate.net/publication/378281835_Pet_Tracking_System_Using_GP
         S_with_Android-Based_Geofencing_Method


Perea, A. R., Rahman, S., Chen, H., Cox, A., Nyamuryekung'e, S., Bakir, M., Cao, H., Estell,
         R., Bestelmeyer, B., Cibils, A. F., & Utsumi, S. (2025). Use of LoRaWAN wireless
         sensor data transmission and machine learning models to classify the behavior of beef
         cows grazing desert rangelands in the Southwest United States. SSRN.
         https://doi.org/10.2139/ssrn.5149569


Philippine Statistics Authority. (2025). Livestock and poultry quarterly bulletin, October to
         December 2024.
         https://psa.gov.ph/statistics/lp/all-commodity/inventory/node/1684066794
```

## PDF page 76

```text
Philippine Statistics Authority. (2026, January 28). Value of production in Philippine agriculture
         and fisheries improves to 0.5 percent growth rate in the fourth quarter of 2025 (at
         constant 2018 prices).
         https://psa.gov.ph/content/value-production-philippine-agriculture-and-fisheries-improve
         s-05-percent-growth-rate


Podevijn, N., Trogh, J., Plets, D., Joseph, W., Martens, L., & Hoebeke, J. (2018). TDoA-Based
         Outdoor Positioning with Tracking Algorithm in a Public LoRa Network. Wireless
         Communications and Mobile Computing, 2018, Article 1864209.
         https://doi.org/10.1155/2018/1864209


Putra, A. G., et al. (2025). AgroTrack: A LoRa-IoT framework with machine learning for remote
         livestock monitoring in smart agriculture. arXiv. https://arxiv.org/html/2510.07322v1


Renesas Electronics Corporation. (n.d.). ESP-WROOM-32 data sheet [Datasheet].
         https://www.renesas.com/en/document/dst/espwroom-32-data-sheet


Risteska-Stojkoska, B., et. al.  (2018). Real-time internet of things architecture for wireless
         livestock tracking. Telfor Journal, 10(2), 74-80. https://doi.org/10.5937/telfor1802074r.


Rivero, M. J., Grau-Campanario, P., Mullan, S., Held, S. D. E., Stokes, J. E., Lee, M. R. F., &
         Cardenas, L. M. (2021). Factors affecting site use preference of grazing cattle studied
         from 2000 to 2020 through GPS tracking: A review. Sensors, 21(8), Article 2696.
         https://doi.org/10.3390/s21082696


Riccardi, F. (n.d.). ESP32 power consumption notes [GitHub Gist]. GitHub.
         https://gist.github.com/fabianoriccardi/83fd33797cfb301d6c7f5c4db4b5616d


Rizos, C. (2003). Trends in GPS technology & applications. Satellite Navigation & Positioning
         Group, School of Surveying and Spatial Information Systems, The University of New
         South Wales


Rosmiati, M., Fachru Rizal, M., & Wanti, I. (2018). Monitoring Location Prototype Using Lora
         Module. MATEC Web of Conferences, 218, 03007.
         https://doi.org/10.1051/matecconf/201821803007


Rothenpieler, A., et al. (2020). LoRa 2.4 GHz communication link and range. Sensors, 20(16),
         4366. https://doi.org/10.3390/s20164366
```

## PDF page 77

```text
Rovai, M., et al. (2021). Practical experiences of a smart livestock location monitoring system
         leveraging GNSS, LoRaWAN and cloud services. Sensors.
         https://pubmed.ncbi.nlm.nih.gov/35009814/


Scheepers, G., et. al. (2017). A low-power cost-effective flexible solar panel powered device for
         wireless livestock tracking. In 2017 25th Telecommunication Forum (TELFOR). IEEE.
         https://doi.org/10.1109/TELFOR.2017.8249349.


Schoenecker, K. A., King, S. R. B., Hennig, J. D., Cole, M. J., Scasta, J. D., & Beck, J. L.
         (2024). Effects of telemetry collars on two free-roaming feral equid species. PLOS ONE,
         19(5), e0303312. https://doi.org/10.1371/journal.pone.0303312


Schroeder, T. C., & Tonsor, G. T. (2012). International cattle ID and traceability: Competitive
         implications for the US. Food Policy, 37(1), 31–40.
         https://doi.org/10.1016/j.foodpol.2011.10.005


Schulthess, L., Longchamp, F., Vogt, C., & Magno, M. (2023). A LoRa-based and
         maintenance-free cattle monitoring system for alpine pastures and remote locations. In
         Proceedings of the 11th International Workshop on Energy Harvesting and
         Energy-Neutral Sensing Systems (ENSsys ’23).
         https://doi.org/10.1145/3628353.3628549


Semtech Corporation. (n.d.). SX1276/77/78/79: LoRa® transceiver datasheet.
         https://semtech.my.salesforce.com/sfc/p/#E0000000JelG/a/2R0000001Rbr/6EfVZUorrp
         oKFfvaF_Fkpgp5kzjiNyiAbqcpqh9qSjE


Simoyi, L., & Mugauri, C. (2022). Low cost IoT based livestock tracking system for Zimbabwe.
         Volume 11 Issue 2


Siguín, M., Blanco, T., Rossano, F., & Casas, R. (2021). Modular E-Collar for Animal Telemetry:
         An Animal-Centered Design Proposal. Sensors, 22(1), 300.
         https://doi.org/10.3390/s22010300


Soy, H. (2023). Coverage Analysis of LoRa and NB-IoT Technologies on LPWAN-Based
         Agricultural Vehicle Tracking Application. Sensors, 23(21), 8859.
         https://doi.org/10.3390/s23218859


Stewart, D. G., et. al. (2025). Comparison of GPS collars and solar-powered GPS ear tags for
         animal movement studies. Smart Agricultural Technology, 11, 101021.
         https://doi.org/10.1016/j.atech.2025.101021.
```

## PDF page 78

```text
Suganya, V. (2022). Usage and perception of geofencing. EPRA International Journal of
         Economics, Business and Management Studies (EBMS), 9(2).
         https://doi.org/10.36713/epra9463


Tinoco, J., et. al. (2024). A multi-sensory cattle monitoring system with wireless and solar
         charging capabilities. In 2024 IEEE International Conference on Sustainable Green
         Energy and Engineering (SEGE). IEEE.
         https://doi.org/10.1109/SEGE62220.2024.10739408.


Topete, A., He, C., Protzko, J., Schooler, J., & Hegarty, M. (2024). How is GPS used?
         Understanding navigation system use and its relation to spatial ability. Cognitive
         Research: Principles and Implications, 9, Article 16.
         https://doi.org/10.1186/s41235-024-00545-x


Tripela Team. (2025, May 20). GPS in urban canyons: Solving transit location challenges.
         Tripela.net


uPesy. (n.d.). uPesy micro SD reader module documentation (latest version).
         https://www.upesy.com/blogs/tutorials/upesy-micro-sd-reader-module-documentation-ve
         rsion-latest


Vargas-Salazar, C., et al. (2022). Real time geolocation system for livestock based in LoRa.
         IEEE Xplore. https://ieeexplore.ieee.org/document/9820172.


Vazquez-Rodas, A., Astudillo-Salinas, F., Sanchez, C., Arpi, B., & Minchala, L. I. (2020).
         Experimental evaluation of RSSI-based positioning system with low-cost LoRa devices.
         Ad Hoc Networks, 105, 102168. https://doi.org/10.1016/j.adhoc.2020.102168


Wijeratne, L., Kiv, D., Waczak, J., Dewage, P., Balagopal, G., Iqbal, M., Aker, A., Fernando, B.
         A., Lary, M. D., Sooriyaarachchi, V., Patra, R., Desmond, N., Zabiepour, H., Xi, D.,
         Agnihotri, V., Lee, S., Simmons, C., & Lary, D. J. (2024). The Design and Deployment of
         a Self-Powered, LoRaWAN-Based IoT Environment Sensor Ensemble for Integrated Air
         Quality Sensing and Simulation. MDPI Preprints.
         https://doi.org/10.20944/preprints202411.1145.v1


Wilson, R. P., Rose, K. A., Gunner, R., et al. (2021). Animal lifestyle affects acceptable mass
         limits for attached tags. Proceedings of the Royal Society B: Biological Sciences,
         288(1961). https://doi.org/10.1098/rspb.2021.2005
```

## PDF page 79

```text
Wu, W., Wang, W., Wang, B., & Song, R. (2021). Throughput of distributed queueing-based
         LoRa for long-distance communication. EURASIP Journal on Advances in Signal
         Processing, 2021(1), Article 28. https://doi.org/10.1186/s13634-021-00739-1


Xiong, Y., MacDonald, J. C., Volesky, J. D., Stephenson, M. B., & Schacht, W. H. (2024).
         Technical note: Assessing GPS sensor accuracy using real-time kinematic device for
         livestock tracking. Journal of Animal Science.
         https://academic.oup.com/jas/article/doi/10.1093/jas/skae253/7742273


Zantsi, S., & Nkunjana, T. (2021). A review of possibilities for using animal tracking devices to
         mitigate stock theft in smallholder livestock farming systems in rural South Africa. South
         African Journal of Agricultural Extension, 49(1), 162–182.
         http://dx.doi.org/10.17159/2413-3221/2021/v49n1a10784


Zhang, S., et. al. (2026). A fast integral terminal sliding mode buck converter with a fixed-time
         observer for solar-powered livestock smart collars. Agriculture, 16(7), 746.
         https://doi.org/10.3390/agriculture16070746
```

## PDF page 80

```text
Appendices
```

## PDF page 81

```text
Appendix A
                                            Budget for Engineering Works
```

## PDF page 82

```text
Description                                 Qty (per pc)             Unit Cost (₱)           Cost (₱)

 Materials

    SX1276 915MHz                                      6                           330.00                1,980.00

    ESP32-C3                                           6                             87.00                 522.00

    3.7V LiPo Battery 1Ah                              6                           369.00                2,214.00

    2.8 inch ILI9341 TFT LCD                           1                           417.55                  417.55

    GY-NEO6MV2 NEO-6M Ublox                            6                           299.00                1,794.00

    Electronic Supplies Waterproof                     6                           114.76                  688.56
    ABS Plastic Project Box

    PN532                                              5                           173.22                  866.10

    Collar                                             5                             59.00                 295.00

    MT3608                                             6                             33.00                 198.00

    10pcs TP4056                                       1                           100.00                  100.00

 Total Material Cost                                                  Subtotal                         ₱9,075.21

 Documentation

    Printing                                                                                             2,000.00

    Plagiarism Checker                                                                                     750.00

    Grammar Check                                                                                        1,500.00

    Hard Bound                                                                                           5,000.00

 Total Documentation Cost                                             Subtotal                         ₱9,250.00

 Installation and Testing

    Soldering                                                                                              500.00
```

## PDF page 83

```text
Total Installation and Testing                                         Subtotal                             ₱500.00
 Cost

 Miscellaneous

    Miscellaneous                                                                                           3,000.00

    Margin of Safety                                                                                         1000.00

    Travel                                                                                                  3,000.00

 Total Miscellaneous Cost                                               Subtotal                          ₱7,000.00

 Total Project Cost                                                     Grand Total                      ₱25,825.21
```

## PDF page 84

```text
Appendix B
                                           Engineering Working Schedule
```

## PDF page 85

> NO MACHINE-READABLE TEXT; OCR REQUIRED for a complete transcription. Visually inspected: rotated engineering working-schedule table spanning July-March 2026-2027, yellow time blocks, activities including design plan, prototype, permission, collection, construction, canvassing/purchase, testing, revisions, installation, analysis, implementation/data gathering, assessment, hardbound and final defense. Exact cell assignments are NOT transcribed.

## PDF page 86

```text
Appendix C
                                            Device Specifications & Design
```

## PDF page 87

```text
Tracker Device

 Component                                               Total Energy Consumed (mW-hr/day)

 GY-NEO6MV2 NEO-6M Ublox                                                     21.6

 ESP32-C3 Mini                                                               4.0

 SX1276 915MHz @ 13dBm                                                       0.06

 Total                                                                      25.66


Battery Specification

 Parameter                                                                  Value

 Battery Capacity                                                         370 mWh

 Estimated Battery Runtime                                  346.06 hours (14 days, 10 hours)


Master Device

 Component                                                     Current Consumption (mW)

 ESP32-C3 Mini                                                              1155

 Micro SD Card Module                                                         50

 SX1276 915MHz                                                               0.6

 Total                                                                     1205.6
```

## PDF page 88

```text
Battery Specification

 Parameter                                                                            Value

 Battery Capacity                                                                    100 mAh

 Estimated Battery Runtime                                                         15.46 hours


Tracker and Master Device Dimensions

 Parameters                                                          Measurement (mm)

 Length                                                                        100

 Width                                                                         60

 Height                                                                        30


Collar Strap Dimension

 Parameters                                                          Measurement (mm)

 Length                                                                        580

 Width                                                                         35
```

## PDF page 89

> NO MACHINE-READABLE TEXT; OCR REQUIRED for a complete transcription. Visually inspected: tracker/master layout and collar drawings. Visible dimensions include 60, 30, 580, 100, and 35; these are image labels, not an independently verified manufacturing drawing.

## PDF page 90

> NO MACHINE-READABLE TEXT; OCR REQUIRED for a complete transcription. Visually inspected: master enclosure CAD view with a label '2.8 TFT with touch display 240*320' and modules marked SX1276, SD, MT3608, and ESP32-C3. Fine labels/connectivity are NOT fully transcribed.
