# Homework 5: Road Generation

For this assignment, you will generate a network of roads to form the basis of a city using a modified version of L-systems. As in homework 4, you will be using instanced rendering to draw your road networks.

## Base Code
We have provided the same code that came with homework 4, but you will likely want to use most of your code from that assignment. Feel free to copy over as much of your homework 4 implementation as you want. We have also provided [Procedural Modeling of Cities](proceduralCityGeneration.pdf), a brief technical paper describing techniques for generating road networks. Refer to this as you implement the sections below.

## Assignment Requirements
- __(10 points)__ Use whatever noise functions suit you to generate 2D map data of the following information, and set up GUI toggles to render each map on a 2D screen quadrangle. The user should have the option to view both overlaid on each other.
  - Terrain elevation, setting anything below a certain height to water. Higher elevation should be lighter in color. Include an option to display a simple land versus water view.
  - Population density. Denser population should be lighter in color.
- __(20 points)__ Create a set of classes to represent a pseudo L-system; you will still have a Turtle to track your drawing state, but you will expand your road network based on the Turtle's current environment as it moves and draws. You won't be tracking a grammar as a set of characters, but you will keep a set of rules to determine how to advance your Turtle.
  - Your Turtle will begin from a random point in the bounds of your screen.
  - Depending on the type of road network being generated (see next section) your Turtle will move forward and draw some sort of road in its wake.
  - Each time the Turtle completes a road segment, it will evaluate whether it should branch to create more roads in different directions (same idea as the push and pop of Turtle state). This is where your expansion rules come in; the Turtle must decide how it will branch (if at all).
  - Store your roads as sets of edges and intersections so that you can more easily make roads connect to one another as described in section 3.3.1 of Procedural Modeling of Cities
- __(20 points)__ Create distinct rule sets for drawing roads that obey the following layouts (refer to figure 5 in [Procedural Modeling of Cities](proceduralCityGeneration.pdf) for illustrations):
  - Basic road branching: The main roads follow population density as a metric for directional bias
  - Checkered road networking: The roads are aligned with some global directional vector and have a maximum block width and length. Intersections are all roughly 90 degrees.
- __(30 points)__ Using the components you created in the previous sections, generate the 2D street layout of a city with the following features:
  - An overarching sparse layout of highway roads that are thicker than other roads
  - Within the highway outline, denser clusters of smaller roads with less visual line thickness than the highways
  - Inclusion of both road branching methods
  - Only highways are allowed to cross water
  - Roads are self-sensitive, as described in section 3.3.1 of Procedural Modeling of Cities

- __(10 points)__ Using dat.GUI, make at least three aspects of your program interactive, such as:
  - Terrain shape
  - Population density
  - Highway density
  - Random seed used for the RNG basis of road branching

- __(10 points)__ Following the specifications listed
[here](https://github.com/pjcozzi/Articles/blob/master/CIS565/GitHubRepo/README.md),
create your own README.md, renaming the file you are presently reading to
INSTRUCTIONS.md. Don't worry about discussing runtime optimization for this
project. Make sure your README contains the following information:
    - Your name and PennKey
    - Citation of any external resources you found helpful when implementing this
    assignment.
    - A link to your live github.io demo (refer to the pinned Piazza post on
      how to make a live demo through github.io)
    - An explanation of the techniques you used to generate your L-System features.
    Please be as detailed as you can; not only will this help you explain your work
    to recruiters, but it helps us understand your project when we grade it!

## Expected visual output
The results of your road generation need only be simple 2D images, like the ones in Procedural Modeling of Cities. You may make 3D terrain with overlaid roads if you want, but for this assignment it's not necessary.

![](nyc.png)

## Extra Credit (Up to 20 points)
- Implement additional road layouts as described in Procedural Modeling of Cities
  - Radial road networking: The main roads follow radial tracks around some predefined centerpoint
  - Elevation road networking: Roads follow paths of least elevation change
- Add any polish features you'd like to make your visual output more interesting
