import User from "../models/User.js";

function extractUserId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value !== null) {
    return value._id || null;
  }

  return value;
}

export async function findRequestHospitalUser(
  request,
  projection = "fullName email phone address location role",
) {
  if (!request) {
    return null;
  }

  const requestedById = extractUserId(request.requestedBy);
  if (requestedById) {
    const requestedByUser = await User.findById(requestedById, projection);
    if (requestedByUser?.role === "hospital") {
      return requestedByUser;
    }
  }

  const hospitalName = request.destinationHospital || request.hospital;
  if (!hospitalName) {
    return null;
  }

  return User.findOne({ fullName: hospitalName, role: "hospital" }, projection);
}
