import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Epsilon } from "@babylonjs/core/Maths/math.constants.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { ToCrowdAgentParams } from "../common/config.js";
import { GetRecast } from "../factory/common.js";
/**
 * Recast Detour crowd implementation
 * This class provides methods to manage a crowd of agents, allowing them to navigate a navigation mesh.
 * It supports adding agents, updating their parameters, moving them to destinations, and checking their states.
 * The crowd is updated in the scene's animation loop, and it notifies observers when agents reach their destinations.
 */
export class RecastJSCrowd {
    /**
     * Recast plugin
     */
    get navigationPlugin() {
        return this._navigationPlugin;
    }
    /**
     * Link to the detour crowd
     */
    get recastCrowd() {
        return this._recastCrowd;
    }
    /**
     * One transform per agent
     */
    get transforms() {
        return this._transforms;
    }
    /**
     * All agents created
     */
    get agents() {
        return Object.freeze(this._agents);
    }
    /**
     * Agents reach radius
     */
    get reachRadii() {
        return Object.freeze(this._reachRadii);
    }
    /**
     * Constructor
     * @param plugin recastJS plugin
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    constructor(plugin, maxAgents, maxAgentRadius, scene) {
        this._transforms = [];
        this._agents = [];
        this._reachRadii = [];
        /**
         * true when a destination is active for an agent and notifier hasn't been notified of reach
         */
        this._agentDestinationArmed = new Array();
        /**
         * agent current target
         */
        this._agentDestination = new Array();
        /**
         * Observer for crowd updates
         */
        this._onBeforeAnimationsObserver = null;
        /**
         * Fires each time an agent is in reach radius of its destination
         */
        this.onReachTargetObservable = new Observable();
        this._navigationPlugin = plugin;
        if (!plugin.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }
        this._recastCrowd = new (GetRecast().Crowd)(plugin.navMesh, {
            maxAgents,
            maxAgentRadius,
        });
        this._scene = scene;
        this._engine = scene.getEngine();
        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            this.update(this._engine.getDeltaTime() * 0.001 * plugin.timeFactor);
        });
    }
    /**
     * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
     * You can attach anything to that node. The node position is updated in the scene update tick.
     * @param pos world position that will be constrained by the navigation mesh
     * @param parameters agent parameters
     * @param transform hooked to the agent that will be update by the scene
     * @returns agent index
     */
    addAgent(pos, parameters, transform) {
        const agentParams = ToCrowdAgentParams(parameters);
        const agent = this._recastCrowd.addAgent({ x: pos.x, y: pos.y, z: pos.z }, agentParams);
        this._transforms.push(transform);
        this._agents.push(agent.agentIndex);
        this._reachRadii.push(parameters.reachRadius ? parameters.reachRadius : parameters.radius);
        this._agentDestinationArmed.push(false);
        this._agentDestination.push(new Vector3(0, 0, 0));
        return agent.agentIndex;
    }
    /**
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index) {
        const agentPos = this._recastCrowd.getAgent(index)?.position() ?? Vector3.ZeroReadOnly;
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }
    /**
     * Returns the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentPositionToRef(index, result) {
        const agentPos = this._recastCrowd.getAgent(index)?.position() ?? Vector3.ZeroReadOnly;
        result.set(agentPos.x, agentPos.y, agentPos.z);
    }
    /**
     * Returns the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index) {
        const agentVel = this._recastCrowd.getAgent(index)?.velocity() ?? Vector3.ZeroReadOnly;
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }
    /**
     * Returns the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    getAgentVelocityToRef(index, result) {
        const agentVel = this._recastCrowd.getAgent(index)?.velocity() ?? Vector3.ZeroReadOnly;
        result.set(agentVel.x, agentVel.y, agentVel.z);
    }
    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentNextTargetPath(index) {
        const pathTargetPos = this._recastCrowd.getAgent(index)?.nextTargetInPath() ?? Vector3.ZeroReadOnly;
        return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }
    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentNextTargetPathToRef(index, result) {
        const pathTargetPos = this._recastCrowd.getAgent(index)?.nextTargetInPath() ?? Vector3.ZeroReadOnly;
        result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }
    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state, 0 = DT_CROWDAGENT_STATE_INVALID, 1 = DT_CROWDAGENT_STATE_WALKING, 2 = DT_CROWDAGENT_STATE_OFFMESH
     */
    getAgentState(index) {
        return this._recastCrowd.getAgent(index)?.state() ?? 0; // invalid
    }
    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    overOffmeshConnection(index) {
        return this._recastCrowd.getAgent(index)?.overOffMeshConnection() ?? false;
    }
    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentGoto(index, destination) {
        this._recastCrowd.getAgent(index)?.requestMoveTarget(destination);
        // arm observer
        const item = this._agents.indexOf(index);
        if (item > -1) {
            this._agentDestinationArmed[item] = true;
            this._agentDestination[item].set(destination.x, destination.y, destination.z);
        }
    }
    /**
     * Teleport the agent to a new position
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentTeleport(index, destination) {
        this._recastCrowd.getAgent(index)?.teleport(destination);
    }
    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    updateAgentParameters(index, parameters) {
        const agent = this._recastCrowd.getAgent(index);
        if (!agent) {
            return;
        }
        const agentParams = agent.parameters();
        if (!agentParams) {
            return;
        }
        if (parameters.radius !== undefined) {
            agentParams.radius = parameters.radius;
        }
        if (parameters.height !== undefined) {
            agentParams.height = parameters.height;
        }
        if (parameters.maxAcceleration !== undefined) {
            agentParams.maxAcceleration = parameters.maxAcceleration;
        }
        if (parameters.maxSpeed !== undefined) {
            agentParams.maxSpeed = parameters.maxSpeed;
        }
        if (parameters.collisionQueryRange !== undefined) {
            agentParams.collisionQueryRange = parameters.collisionQueryRange;
        }
        if (parameters.pathOptimizationRange !== undefined) {
            agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
        }
        if (parameters.separationWeight !== undefined) {
            agentParams.separationWeight = parameters.separationWeight;
        }
        agent.updateParameters(agentParams);
    }
    /**
     * remove a particular agent previously created
     * @param index agent index returned by addAgent
     */
    removeAgent(index) {
        this._recastCrowd.removeAgent(index);
        const item = this._agents.indexOf(index);
        if (item > -1) {
            this._agents.splice(item, 1);
            this._transforms.splice(item, 1);
            this._reachRadii.splice(item, 1);
            this._agentDestinationArmed.splice(item, 1);
            this._agentDestination.splice(item, 1);
        }
    }
    /**
     * get the list of all agents attached to this crowd
     * @returns list of agent indices
     */
    getAgents() {
        return this._agents;
    }
    /**
     * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
     * @param deltaTime in seconds
     */
    update(deltaTime) {
        if (deltaTime <= Epsilon) {
            return;
        }
        // update crowd
        const timeStep = this._navigationPlugin.getTimeStep();
        const maxStepCount = this._navigationPlugin.getMaximumSubStepCount();
        if (timeStep <= Epsilon) {
            this._recastCrowd.update(deltaTime);
        }
        else {
            let iterationCount = Math.floor(deltaTime / timeStep);
            if (maxStepCount && iterationCount > maxStepCount) {
                iterationCount = maxStepCount;
            }
            if (iterationCount < 1) {
                iterationCount = 1;
            }
            const step = deltaTime / iterationCount;
            for (let i = 0; i < iterationCount; i++) {
                this._recastCrowd.update(step);
            }
        }
        // update transforms
        for (let index = 0; index < this._agents.length; index++) {
            // update transform position
            const agentIndex = this._agents[index];
            const agentPosition = this.getAgentPosition(agentIndex);
            this._transforms[index].position = agentPosition;
            // check agent reach destination
            if (this._agentDestinationArmed[index]) {
                const dx = agentPosition.x - this._agentDestination[index].x;
                const dz = agentPosition.z - this._agentDestination[index].z;
                const radius = this._reachRadii[index];
                const groundY = this._agentDestination[index].y - this._reachRadii[index];
                const ceilingY = this._agentDestination[index].y + this._reachRadii[index];
                const distanceXZSquared = dx * dx + dz * dz;
                if (agentPosition.y > groundY && agentPosition.y < ceilingY && distanceXZSquared < radius * radius) {
                    this._agentDestinationArmed[index] = false;
                    this.onReachTargetObservable.notifyObservers({
                        agentIndex: agentIndex,
                        destination: this._agentDestination[index],
                    });
                }
            }
        }
    }
    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent) {
        this._navigationPlugin.setDefaultQueryExtent(extent);
    }
    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent() {
        const p = this._navigationPlugin.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }
    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result) {
        const p = this._navigationPlugin.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }
    /**
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    getCorners(index) {
        const corners = this._recastCrowd.getAgent(index)?.corners();
        if (!corners) {
            return [];
        }
        const positions = [];
        for (let i = 0; i < corners.length; i++) {
            positions.push(new Vector3(corners[i].x, corners[i].y, corners[i].z));
        }
        return positions;
    }
    /**
     * Release all resources
     */
    dispose() {
        this._recastCrowd.destroy();
        if (this._onBeforeAnimationsObserver) {
            this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
            this._onBeforeAnimationsObserver = null;
        }
        this.onReachTargetObservable.clear();
    }
}
//# sourceMappingURL=RecastJSCrowd.js.map