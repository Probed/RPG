TileTypes
---

### How does a TileType work.

Each time a character wants to move into a tile location, the TileTypes for the tiles at that location are merged together and triggered in an event chain to determine the outcome of the move request.

![TileType Trigger Chain](https://github.com/Probed/RPG/blob/master/common/Map/Tiles/TileTypes.png)