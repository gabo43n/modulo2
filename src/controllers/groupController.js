const groupService = require('../services/groupService');

function list(req, res, next) {
  try {
    const groups = groupService.listGroups(req.user.id);
    res.json({ data: groups });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const group = groupService.getGroupById(req.user.id, req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'NotFound', message: 'Grupo no encontrado' });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const group = groupService.createGroup(req.user.id, req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const group = groupService.updateGroup(req.user.id, req.params.id, req.body);
    if (!group) {
      return res.status(404).json({ error: 'NotFound', message: 'Grupo no encontrado' });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const deleted = groupService.deleteGroup(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'NotFound', message: 'Grupo no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function getContacts(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = groupService.getGroupContacts(req.user.id, req.params.id, { page, limit });
    if (!result) {
      return res.status(404).json({ error: 'NotFound', message: 'Grupo no encontrado' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getContacts,
};
